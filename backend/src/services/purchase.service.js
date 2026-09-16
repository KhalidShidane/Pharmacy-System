const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Batch = require('../models/Batch');
const InventoryTransaction = require('../models/InventoryTransaction');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/withTransaction');
const auditService = require('./audit.service');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function generateInvoiceNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `PO-${datePart}-${randomPart}`;
}

/**
 * Receives new stock from a supplier. Each line creates a brand-new Batch
 * (a purchase is a physical delivery, so it's never merged into an existing
 * batch) and writes a matching InventoryTransaction — the same audit trail
 * pattern used everywhere else stock changes.
 */
async function createPurchase({ supplierId, items, discount = 0, tax = 0, amountPaid, invoiceNumber }, user, req) {
  if (!supplierId) throw new ApiError(400, 'A supplier is required');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Purchase must include at least one item');
  }
  if (typeof amountPaid !== 'number' || amountPaid < 0) {
    throw new ApiError(400, 'amountPaid must be a non-negative number');
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) throw new ApiError(404, 'Supplier not found');

  const purchase = await withTransaction(async (session) => {
    let subtotal = 0;
    const purchaseItemInputs = [];
    const batchInputs = [];

    for (const line of items) {
      const { medicineId, batchNumber, expiryDate, quantity, purchasePrice, sellingPrice } = line;
      if (!medicineId || !batchNumber || !expiryDate || !quantity || quantity <= 0) {
        throw new ApiError(400, 'Each line requires a medicine, batch number, expiry date and positive quantity');
      }
      if (purchasePrice == null || purchasePrice < 0 || sellingPrice == null || sellingPrice < 0) {
        throw new ApiError(400, 'Purchase price and selling price must be provided and non-negative');
      }
      if (new Date(expiryDate) <= new Date()) {
        throw new ApiError(400, `Expiry date for batch ${batchNumber} must be in the future`);
      }

      const medicine = await Medicine.findById(medicineId).session(session);
      if (!medicine || !medicine.isActive) {
        throw new ApiError(404, 'Medicine not found or inactive');
      }

      subtotal += purchasePrice * quantity;
      purchaseItemInputs.push({ medicine: medicine._id, batchNumber, expiryDate, quantity, purchasePrice, sellingPrice });
      batchInputs.push({ medicine: medicine._id, batchNumber, expiryDate, quantity, purchasePrice, sellingPrice });
    }

    const total = round2(Math.max(subtotal - discount, 0) + tax);
    let status;
    if (amountPaid >= total) status = 'paid';
    else if (amountPaid > 0) status = 'partial';
    else status = 'pending';

    let finalInvoiceNumber = invoiceNumber || generateInvoiceNumber();
    let purchaseDoc;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        [purchaseDoc] = await Purchase.create(
          [
            {
              supplier: supplier._id,
              invoiceNumber: finalInvoiceNumber,
              items: [],
              subtotal: round2(subtotal),
              discount,
              tax,
              total,
              amountPaid,
              status,
              createdBy: user.id,
            },
          ],
          { session }
        );
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) {
          finalInvoiceNumber = generateInvoiceNumber();
          continue;
        }
        throw err;
      }
    }

    const createdPurchaseItems = await PurchaseItem.create(
      purchaseItemInputs.map((i) => ({ ...i, purchase: purchaseDoc._id })),
      { session }
    );
    purchaseDoc.items = createdPurchaseItems.map((i) => i._id);
    await purchaseDoc.save({ session });

    for (const b of batchInputs) {
      const [batch] = await Batch.create(
        [
          {
            medicine: b.medicine,
            batchNumber: b.batchNumber,
            supplier: supplier._id,
            purchaseDate: new Date(),
            expiryDate: b.expiryDate,
            purchasePrice: b.purchasePrice,
            sellingPrice: b.sellingPrice,
            quantity: b.quantity,
            remainingQuantity: b.quantity,
            status: 'active',
          },
        ],
        { session }
      );

      await InventoryTransaction.create(
        [
          {
            medicine: b.medicine,
            batch: batch._id,
            type: 'purchase',
            quantity: b.quantity,
            previousQuantity: 0,
            newQuantity: b.quantity,
            user: user.id,
            referenceType: 'Purchase',
            referenceId: purchaseDoc._id,
            reason: `Purchase ${finalInvoiceNumber}`,
          },
        ],
        { session }
      );
    }

    if (amountPaid > 0) {
      await Payment.create(
        [
          {
            partyType: 'supplier',
            party: supplier._id,
            partyModel: 'Supplier',
            direction: 'out',
            amount: amountPaid,
            method: 'cash',
            referenceType: 'purchase',
            referenceId: purchaseDoc._id,
            recordedBy: user.id,
          },
        ],
        { session }
      );
    }

    return purchaseDoc;
  });

  await auditService.logAction({
    user: user.id,
    action: 'purchase.created',
    resource: 'Purchase',
    resourceId: purchase._id,
    metadata: { invoiceNumber: purchase.invoiceNumber, total: purchase.total, status: purchase.status },
    ip: req?.ip,
  });

  return Purchase.findById(purchase._id)
    .populate('supplier', 'name phone')
    .populate('createdBy', 'name')
    .populate({ path: 'items', populate: { path: 'medicine', select: 'name unit' } });
}

async function listPurchases({ supplier, status, from, to, page = 1, limit = 20 }) {
  const filter = {};
  if (supplier) filter.supplier = supplier;
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [purchases, total] = await Promise.all([
    Purchase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('supplier', 'name').populate('createdBy', 'name').lean(),
    Purchase.countDocuments(filter),
  ]);

  return { purchases, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 };
}

async function getPurchaseById(id) {
  const purchase = await Purchase.findById(id)
    .populate('supplier', 'name phone email address')
    .populate('createdBy', 'name')
    .populate({ path: 'items', populate: { path: 'medicine', select: 'name unit' } });
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}

module.exports = { createPurchase, listPurchases, getPurchaseById };
