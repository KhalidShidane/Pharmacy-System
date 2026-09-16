const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const InventoryTransaction = require('../models/InventoryTransaction');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');
const inventoryService = require('../services/inventory.service');

const list = asyncHandler(async (req, res) => {
  const { query, category, barcode, includeInactive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (!includeInactive) filter.isActive = true;
  if (category) filter.category = category;
  if (barcode) filter.barcode = barcode;
  if (query && !barcode) {
    filter.$or = [
      { name: new RegExp(query, 'i') },
      { genericName: new RegExp(query, 'i') },
      { brand: new RegExp(query, 'i') },
      { barcode: new RegExp(`^${query}$`, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [medicines, total] = await Promise.all([
    Medicine.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name')
      .populate('manufacturer', 'name')
      .lean(),
    Medicine.countDocuments(filter),
  ]);

  const stockMap = await inventoryService.getCurrentStockMap(medicines.map((m) => m._id));
  const data = medicines.map((m) => ({ ...m, currentStock: stockMap.get(String(m._id)) || 0 }));

  res.json({ success: true, data, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 } });
});

const getById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('category', 'name').populate('manufacturer', 'name');
  if (!medicine) throw new ApiError(404, 'Medicine not found');

  const batches = await Batch.find({ medicine: medicine._id }).sort({ expiryDate: 1 }).populate('supplier', 'name');
  const currentStock = await inventoryService.getCurrentStock(medicine._id);

  res.json({ success: true, data: { ...medicine.toObject(), batches, currentStock } });
});

const create = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  await auditService.logAction({ user: req.user.id, action: 'medicine.created', resource: 'Medicine', resourceId: medicine._id, ip: req.ip });
  res.status(201).json({ success: true, data: medicine });
});

const update = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!medicine) throw new ApiError(404, 'Medicine not found');
  await auditService.logAction({ user: req.user.id, action: 'medicine.updated', resource: 'Medicine', resourceId: medicine._id, ip: req.ip });
  res.json({ success: true, data: medicine });
});

// Soft delete: medicines are referenced by batches / historical sale items,
// so they're deactivated rather than hard-deleted to preserve those records.
const remove = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!medicine) throw new ApiError(404, 'Medicine not found');
  await auditService.logAction({ user: req.user.id, action: 'medicine.deactivated', resource: 'Medicine', resourceId: medicine._id, ip: req.ip });
  res.json({ success: true, data: medicine });
});

const addBatch = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw new ApiError(404, 'Medicine not found');

  const { batchNumber, supplier, purchaseDate, expiryDate, purchasePrice, sellingPrice, quantity } = req.body;
  if (!batchNumber || !expiryDate || quantity == null || purchasePrice == null || sellingPrice == null) {
    throw new ApiError(400, 'batchNumber, expiryDate, quantity, purchasePrice and sellingPrice are required');
  }
  if (new Date(expiryDate) <= new Date()) {
    throw new ApiError(400, 'Expiry date must be in the future');
  }

  const batch = await Batch.create({
    medicine: medicine._id,
    batchNumber,
    supplier: supplier || undefined,
    purchaseDate: purchaseDate || Date.now(),
    expiryDate,
    purchasePrice,
    sellingPrice,
    quantity,
    remainingQuantity: quantity,
    status: 'active',
  });

  await InventoryTransaction.create({
    medicine: medicine._id,
    batch: batch._id,
    type: 'purchase',
    quantity,
    previousQuantity: 0,
    newQuantity: quantity,
    user: req.user.id,
    referenceType: 'Batch',
    referenceId: batch._id,
    reason: `Initial stock for batch ${batchNumber}`,
  });

  await auditService.logAction({ user: req.user.id, action: 'batch.created', resource: 'Batch', resourceId: batch._id, metadata: { medicine: medicine._id, batchNumber }, ip: req.ip });

  res.status(201).json({ success: true, data: batch });
});

module.exports = { list, getById, create, update, remove, addBatch };
