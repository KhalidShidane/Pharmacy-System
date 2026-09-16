const asyncHandler = require('express-async-handler');
const Manufacturer = require('../models/Manufacturer');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const list = asyncHandler(async (_req, res) => {
  const manufacturers = await Manufacturer.find().sort({ name: 1 });
  res.json({ success: true, data: manufacturers });
});

const create = asyncHandler(async (req, res) => {
  const { name, country, contact } = req.body;
  if (!name) throw new ApiError(400, 'Manufacturer name is required');
  const manufacturer = await Manufacturer.create({ name, country, contact });
  await auditService.logAction({ user: req.user.id, action: 'manufacturer.created', resource: 'Manufacturer', resourceId: manufacturer._id, ip: req.ip });
  res.status(201).json({ success: true, data: manufacturer });
});

const update = asyncHandler(async (req, res) => {
  const manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!manufacturer) throw new ApiError(404, 'Manufacturer not found');
  await auditService.logAction({ user: req.user.id, action: 'manufacturer.updated', resource: 'Manufacturer', resourceId: manufacturer._id, ip: req.ip });
  res.json({ success: true, data: manufacturer });
});

const remove = asyncHandler(async (req, res) => {
  const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
  if (!manufacturer) throw new ApiError(404, 'Manufacturer not found');
  await auditService.logAction({ user: req.user.id, action: 'manufacturer.deleted', resource: 'Manufacturer', resourceId: manufacturer._id, ip: req.ip });
  res.json({ success: true, data: null });
});

module.exports = { list, create, update, remove };
