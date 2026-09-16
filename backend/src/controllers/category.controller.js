const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const list = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
});

const create = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');
  const category = await Category.create({ name, description });
  await auditService.logAction({ user: req.user.id, action: 'category.created', resource: 'Category', resourceId: category._id, ip: req.ip });
  res.status(201).json({ success: true, data: category });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  await auditService.logAction({ user: req.user.id, action: 'category.updated', resource: 'Category', resourceId: category._id, ip: req.ip });
  res.json({ success: true, data: category });
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await auditService.logAction({ user: req.user.id, action: 'category.deleted', resource: 'Category', resourceId: category._id, ip: req.ip });
  res.json({ success: true, data: null });
});

module.exports = { list, create, update, remove };
