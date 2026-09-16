const asyncHandler = require('express-async-handler');
const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const inventoryService = require('../services/inventory.service');

const summary = asyncHandler(async (req, res) => {
  const { query, category, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (query) filter.name = new RegExp(query, 'i');

  const skip = (Number(page) - 1) * Number(limit);
  const [medicines, total] = await Promise.all([
    Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)).populate('category', 'name').lean(),
    Medicine.countDocuments(filter),
  ]);

  const stockMap = await inventoryService.getCurrentStockMap(medicines.map((m) => m._id));
  const data = medicines.map((m) => {
    const currentStock = stockMap.get(String(m._id)) || 0;
    let status = 'in_stock';
    if (currentStock === 0) status = 'out_of_stock';
    else if (currentStock <= m.minStockLevel) status = 'low_stock';
    return { ...m, currentStock, status };
  });

  res.json({ success: true, data, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 } });
});

const lowStock = asyncHandler(async (_req, res) => {
  const data = await inventoryService.getLowStockMedicines();
  res.json({ success: true, data });
});

const expiring = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const [expiringSoon, expired] = await Promise.all([
    inventoryService.getExpiringBatches(days ? { days: Number(days) } : undefined),
    inventoryService.getExpiredBatches(),
  ]);
  res.json({ success: true, data: { expiringSoon, expired } });
});

const transactions = asyncHandler(async (req, res) => {
  const { medicine, batch, type, from, to, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (medicine) filter.medicine = medicine;
  if (batch) filter.batch = batch;
  if (type) filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('medicine', 'name unit')
      .populate('batch', 'batchNumber')
      .populate('user', 'name')
      .lean(),
    InventoryTransaction.countDocuments(filter),
  ]);

  res.json({ success: true, data: rows, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 } });
});

module.exports = { summary, lowStock, expiring, transactions };
