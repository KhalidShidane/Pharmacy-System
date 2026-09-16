const asyncHandler = require('express-async-handler');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (query) {
    filter.$or = [{ name: new RegExp(query, 'i') }, { contactPerson: new RegExp(query, 'i') }, { phone: new RegExp(query, 'i') }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(filter),
  ]);

  const payableRows = await Purchase.aggregate([
    { $match: { supplier: { $in: suppliers.map((s) => s._id) }, status: { $in: ['pending', 'partial'] } } },
    { $group: { _id: '$supplier', payable: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
  ]);
  const payableMap = new Map(payableRows.map((r) => [String(r._id), r.payable]));

  const data = suppliers.map((s) => ({ ...s.toObject(), payable: payableMap.get(String(s._id)) || 0 }));

  res.json({ success: true, data, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 } });
});

const getById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');

  const purchases = await Purchase.find({ supplier: supplier._id }).sort({ createdAt: -1 }).limit(50);
  const payableAgg = await Purchase.aggregate([
    { $match: { supplier: supplier._id, status: { $in: ['pending', 'partial'] } } },
    { $group: { _id: null, payable: { $sum: { $subtract: ['$total', '$amountPaid'] } }, totalPurchased: { $sum: '$total' } } },
  ]);
  const totalPurchasedAgg = await Purchase.aggregate([
    { $match: { supplier: supplier._id } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  res.json({
    success: true,
    data: {
      ...supplier.toObject(),
      purchases,
      payable: payableAgg[0]?.payable || 0,
      totalPurchased: totalPurchasedAgg[0]?.total || 0,
    },
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email, address } = req.body;
  if (!name) throw new ApiError(400, 'Supplier name is required');
  const supplier = await Supplier.create({ name, contactPerson, phone, email, address });
  await auditService.logAction({ user: req.user.id, action: 'supplier.created', resource: 'Supplier', resourceId: supplier._id, ip: req.ip });
  res.status(201).json({ success: true, data: supplier });
});

const update = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  await auditService.logAction({ user: req.user.id, action: 'supplier.updated', resource: 'Supplier', resourceId: supplier._id, ip: req.ip });
  res.json({ success: true, data: supplier });
});

module.exports = { list, getById, create, update };
