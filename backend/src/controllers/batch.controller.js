const asyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');
const inventoryService = require('../services/inventory.service');

const update = asyncHandler(async (req, res) => {
  const { sellingPrice, expiryDate, status } = req.body;
  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');

  if (sellingPrice != null) batch.sellingPrice = sellingPrice;
  if (expiryDate) batch.expiryDate = expiryDate;
  if (status) batch.status = status;
  await batch.save();

  await auditService.logAction({ user: req.user.id, action: 'batch.updated', resource: 'Batch', resourceId: batch._id, ip: req.ip });
  res.json({ success: true, data: batch });
});

// Manual stock correction (damage, recount, write-off) — always goes through
// inventoryService.applyStockChange so it lands in the InventoryTransaction log.
const adjust = asyncHandler(async (req, res) => {
  const { delta, type = 'adjustment', reason } = req.body;
  if (!delta || typeof delta !== 'number') {
    throw new ApiError(400, 'delta must be a non-zero number');
  }
  if (!['adjustment', 'damage'].includes(type)) {
    throw new ApiError(400, 'type must be "adjustment" or "damage"');
  }

  const batch = await Batch.findById(req.params.id);
  if (!batch) throw new ApiError(404, 'Batch not found');

  await inventoryService.applyStockChange({
    batch,
    delta,
    type,
    userId: req.user.id,
    referenceType: 'manual',
    reason: reason || `Manual ${type}`,
  });

  await auditService.logAction({ user: req.user.id, action: 'batch.adjusted', resource: 'Batch', resourceId: batch._id, metadata: { delta, type, reason }, ip: req.ip });
  res.json({ success: true, data: batch });
});

module.exports = { update, adjust };
