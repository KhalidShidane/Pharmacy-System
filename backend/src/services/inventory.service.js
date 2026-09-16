const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const ApiError = require('../utils/ApiError');
const { expiringSoonDays } = require('../config/env');

/** Total sellable stock for a medicine: active, non-expired batches only. */
async function getCurrentStock(medicineId) {
  const result = await Batch.aggregate([
    {
      $match: {
        medicine: medicineId,
        status: 'active',
        expiryDate: { $gt: new Date() },
      },
    },
    { $group: { _id: null, total: { $sum: '$remainingQuantity' } } },
  ]);
  return result[0]?.total || 0;
}

/** Current stock for many medicines at once -> Map<medicineId string, qty> */
async function getCurrentStockMap(medicineIds = null) {
  const match = {
    status: 'active',
    expiryDate: { $gt: new Date() },
  };
  if (medicineIds) match.medicine = { $in: medicineIds };
  const rows = await Batch.aggregate([
    { $match: match },
    { $group: { _id: '$medicine', total: { $sum: '$remainingQuantity' } } },
  ]);
  const map = new Map();
  rows.forEach((r) => map.set(String(r._id), r.total));
  return map;
}

/**
 * Selects active, non-expired batches for a medicine in FEFO (first-expiry,
 * first-out) order and greedily allocates the requested quantity across them.
 * Never returns expired stock. Throws ApiError(400) if stock is insufficient.
 */
async function getSellableBatchesFEFO(medicineId, quantityNeeded, session = null) {
  const batches = await Batch.find({
    medicine: medicineId,
    status: 'active',
    remainingQuantity: { $gt: 0 },
    expiryDate: { $gt: new Date() },
  })
    .sort({ expiryDate: 1 })
    .session(session);

  const allocations = [];
  let remaining = quantityNeeded;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remainingQuantity, remaining);
    allocations.push({ batch, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    const medicine = await Medicine.findById(medicineId).session(session);
    throw new ApiError(
      400,
      `Insufficient stock for ${medicine?.name || 'medicine'}: requested ${quantityNeeded}, available ${quantityNeeded - remaining}`
    );
  }

  return allocations;
}

/**
 * The only path allowed to mutate a batch's remainingQuantity. Writes a
 * matching InventoryTransaction row for a full audit trail.
 * `delta` is negative for stock leaving (sale/damage), positive for stock
 * arriving (purchase/return_in).
 */
async function applyStockChange({ batch, delta, type, userId, referenceType, referenceId, reason }, session = null) {
  const previousQuantity = batch.remainingQuantity;
  const newQuantity = previousQuantity + delta;

  if (newQuantity < 0) {
    throw new ApiError(400, `Stock change would drive batch ${batch.batchNumber} below zero`);
  }

  batch.remainingQuantity = newQuantity;
  if (newQuantity === 0 && batch.status === 'active') {
    batch.status = 'depleted';
  } else if (newQuantity > 0 && batch.status === 'depleted') {
    batch.status = 'active';
  }
  await batch.save({ session });

  await InventoryTransaction.create(
    [
      {
        medicine: batch.medicine,
        batch: batch._id,
        type,
        quantity: delta,
        previousQuantity,
        newQuantity,
        user: userId,
        referenceType: referenceType || '',
        referenceId: referenceId || undefined,
        reason: reason || '',
      },
    ],
    { session }
  );

  return batch;
}

async function getLowStockMedicines() {
  const medicines = await Medicine.find({ isActive: true }).populate('category', 'name').lean();
  const stockMap = await getCurrentStockMap(medicines.map((m) => m._id));
  return medicines
    .map((m) => ({ ...m, currentStock: stockMap.get(String(m._id)) || 0 }))
    .filter((m) => m.currentStock <= m.minStockLevel);
}

async function getExpiringBatches({ days = expiringSoonDays } = {}) {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return Batch.find({
    status: 'active',
    remainingQuantity: { $gt: 0 },
    expiryDate: { $gt: now, $lte: threshold },
  })
    .sort({ expiryDate: 1 })
    .populate('medicine', 'name unit')
    .lean();
}

async function getExpiredBatches() {
  return Batch.find({
    remainingQuantity: { $gt: 0 },
    expiryDate: { $lte: new Date() },
  })
    .sort({ expiryDate: 1 })
    .populate('medicine', 'name unit')
    .lean();
}

module.exports = {
  getCurrentStock,
  getCurrentStockMap,
  getSellableBatchesFEFO,
  applyStockChange,
  getLowStockMedicines,
  getExpiringBatches,
  getExpiredBatches,
};
