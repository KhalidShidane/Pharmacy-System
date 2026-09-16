const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const ApiError = require('../utils/ApiError');
const withTransaction = require('../utils/withTransaction');
const inventoryService = require('./inventory.service');
const auditService = require('./audit.service');

function generateInvoiceNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randomPart}`;
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

async function createSale({ items, customerId, discount = 0, amountPaid, paymentMethod }, user, req) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Sale must include at least one item');
  }
  if (!['cash', 'card', 'other'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }
  if (typeof amountPaid !== 'number' || amountPaid < 0) {
    throw new ApiError(400, 'amountPaid must be a non-negative number');
  }
  if (typeof discount !== 'number' || discount < 0) {
    throw new ApiError(400, 'discount must be a non-negative number');
  }

  let customer = null;
  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) throw new ApiError(404, 'Customer not found');
  }

  const settings = await Setting.findOne().lean();
  const taxRate = settings?.taxRate || 0;

  const sale = await withTransaction(async (session) => {
    let subtotal = 0;
    let itemsDiscountTotal = 0;
    let grossProfit = 0;
    const saleItemInputs = [];
    const stockMutations = [];

    for (const line of items) {
      const { medicineId, quantity, discount: lineDiscount = 0 } = line;
      if (!medicineId || !quantity || quantity <= 0) {
        throw new ApiError(400, 'Each sale item requires a medicine and a positive quantity');
      }
      if (lineDiscount < 0) {
        throw new ApiError(400, 'Item discount cannot be negative');
      }

      const medicine = await Medicine.findById(medicineId).session(session);
      if (!medicine || !medicine.isActive) {
        throw new ApiError(404, 'Medicine not found or inactive');
      }

      const allocations = await inventoryService.getSellableBatchesFEFO(medicineId, quantity, session);
      const unitPrice = medicine.sellingPrice;

      for (const { batch, quantity: allocQty } of allocations) {
        if (batch.expiryDate <= new Date()) {
          throw new ApiError(400, `Batch ${batch.batchNumber} for ${medicine.name} has expired and cannot be sold`);
        }

        const allocDiscount = round2((lineDiscount * allocQty) / quantity);
        const lineTotal = round2(unitPrice * allocQty - allocDiscount);
        const profit = round2((unitPrice - batch.purchasePrice) * allocQty - allocDiscount);

        subtotal += unitPrice * allocQty;
        itemsDiscountTotal += allocDiscount;
        grossProfit += profit;

        saleItemInputs.push({
          medicine: medicine._id,
          batch: batch._id,
          quantity: allocQty,
          unitPrice,
          unitCost: batch.purchasePrice,
          discount: allocDiscount,
          lineTotal,
          profit,
        });

        stockMutations.push({ batch, delta: -allocQty, medicineName: medicine.name });
      }
    }

    const netBeforeTax = Math.max(subtotal - itemsDiscountTotal - discount, 0);
    const tax = round2(netBeforeTax * (taxRate / 100));
    const total = round2(netBeforeTax + tax);
    const netProfit = round2(grossProfit - discount);

    let status;
    if (amountPaid >= total) status = 'paid';
    else if (amountPaid > 0) status = 'partial';
    else status = 'credit';

    if (status !== 'paid' && !customer) {
      throw new ApiError(400, 'A customer must be selected for partial or credit sales');
    }

    let invoiceNumber = generateInvoiceNumber();
    let saleDoc;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        [saleDoc] = await Sale.create(
          [
            {
              invoiceNumber,
              customer: customer?._id || null,
              items: [],
              subtotal: round2(subtotal),
              discount,
              tax,
              total,
              amountPaid,
              paymentMethod,
              status,
              cashier: user.id,
            },
          ],
          { session }
        );
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) {
          invoiceNumber = generateInvoiceNumber();
          continue;
        }
        throw err;
      }
    }

    const createdSaleItems = await SaleItem.create(
      saleItemInputs.map((i) => ({ ...i, sale: saleDoc._id })),
      { session }
    );

    saleDoc.items = createdSaleItems.map((i) => i._id);
    await saleDoc.save({ session });

    for (const mutation of stockMutations) {
      await inventoryService.applyStockChange(
        {
          batch: mutation.batch,
          delta: mutation.delta,
          type: 'sale',
          userId: user.id,
          referenceType: 'Sale',
          referenceId: saleDoc._id,
          reason: `Sale ${invoiceNumber}`,
        },
        session
      );
    }

    if (customer && total > amountPaid) {
      customer.outstandingDebt = round2(customer.outstandingDebt + (total - amountPaid));
      await customer.save({ session });
    }

    if (customer && amountPaid > 0) {
      await Payment.create(
        [
          {
            partyType: 'customer',
            party: customer._id,
            partyModel: 'Customer',
            direction: 'in',
            amount: amountPaid,
            method: paymentMethod,
            referenceType: 'sale',
            referenceId: saleDoc._id,
            recordedBy: user.id,
          },
        ],
        { session }
      );
    }

    return { saleDoc, netProfit };
  });

  await auditService.logAction({
    user: user.id,
    action: 'sale.created',
    resource: 'Sale',
    resourceId: sale.saleDoc._id,
    metadata: { invoiceNumber: sale.saleDoc.invoiceNumber, total: sale.saleDoc.total, status: sale.saleDoc.status },
    ip: req?.ip,
  });

  return Sale.findById(sale.saleDoc._id)
    .populate('customer', 'name phone')
    .populate('cashier', 'name')
    .populate({ path: 'items', populate: [{ path: 'medicine', select: 'name unit' }, { path: 'batch', select: 'batchNumber expiryDate' }] });
}

async function listSales({ from, to, customerId, status, page = 1, limit = 20 }) {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (customerId) filter.customer = customerId;
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .lean(),
    Sale.countDocuments(filter),
  ]);

  return { sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 };
}

async function getSaleById(id) {
  const sale = await Sale.findById(id)
    .populate('customer', 'name phone')
    .populate('cashier', 'name')
    .populate({
      path: 'items',
      populate: [
        { path: 'medicine', select: 'name unit' },
        { path: 'batch', select: 'batchNumber expiryDate' },
      ],
    });
  if (!sale) throw new ApiError(404, 'Sale not found');
  return sale;
}

module.exports = { createSale, listSales, getSaleById };
