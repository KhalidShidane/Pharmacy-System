const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (query) {
    filter.$or = [{ name: new RegExp(query, 'i') }, { phone: new RegExp(query, 'i') }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);
  res.json({ success: true, data: customers, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 } });
});

const getById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, data: customer });
});

const create = asyncHandler(async (req, res) => {
  const { name, phone, email, address, creditLimit } = req.body;
  if (!name || !phone) throw new ApiError(400, 'Customer name and phone are required');
  const customer = await Customer.create({ name, phone, email, address, creditLimit });
  await auditService.logAction({ user: req.user.id, action: 'customer.created', resource: 'Customer', resourceId: customer._id, ip: req.ip });
  res.status(201).json({ success: true, data: customer });
});

const update = asyncHandler(async (req, res) => {
  const { outstandingDebt, ...safeBody } = req.body; // debt is only mutated by sale/payment flows
  const customer = await Customer.findByIdAndUpdate(req.params.id, safeBody, { new: true, runValidators: true });
  if (!customer) throw new ApiError(404, 'Customer not found');
  await auditService.logAction({ user: req.user.id, action: 'customer.updated', resource: 'Customer', resourceId: customer._id, ip: req.ip });
  res.json({ success: true, data: customer });
});

module.exports = { list, getById, create, update };
