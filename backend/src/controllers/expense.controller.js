const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const EXPENSE_CATEGORIES = ['rent', 'electricity', 'salaries', 'transportation', 'maintenance', 'supplies', 'other'];

const list = asyncHandler(async (req, res) => {
  const { category, from, to, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [expenses, total, totalAgg] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name').lean(),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    success: true,
    data: expenses,
    meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1, sumAmount: totalAgg[0]?.total || 0 },
  });
});

const create = asyncHandler(async (req, res) => {
  const { category, amount, date, description, paymentMethod } = req.body;
  if (!category || !EXPENSE_CATEGORIES.includes(category)) {
    throw new ApiError(400, `category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
  if (amount == null || amount <= 0) {
    throw new ApiError(400, 'amount must be a positive number');
  }
  const expense = await Expense.create({
    category,
    amount,
    date: date || Date.now(),
    description,
    paymentMethod,
    createdBy: req.user.id,
  });
  await auditService.logAction({ user: req.user.id, action: 'expense.created', resource: 'Expense', resourceId: expense._id, metadata: { category, amount }, ip: req.ip });
  res.status(201).json({ success: true, data: expense });
});

const update = asyncHandler(async (req, res) => {
  const { category, amount, date, description, paymentMethod } = req.body;
  if (category && !EXPENSE_CATEGORIES.includes(category)) {
    throw new ApiError(400, `category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    { category, amount, date, description, paymentMethod },
    { new: true, runValidators: true }
  );
  if (!expense) throw new ApiError(404, 'Expense not found');
  await auditService.logAction({ user: req.user.id, action: 'expense.updated', resource: 'Expense', resourceId: expense._id, ip: req.ip });
  res.json({ success: true, data: expense });
});

const remove = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');
  await auditService.logAction({ user: req.user.id, action: 'expense.deleted', resource: 'Expense', resourceId: expense._id, ip: req.ip });
  res.json({ success: true, data: null });
});

module.exports = { list, create, update, remove };
