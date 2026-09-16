const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const inventoryService = require('./inventory.service');
const { expiringSoonDays } = require('../config/env');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getSummary() {
  const todayStart = startOfToday();

  const [todaySalesAgg, todayProfitAgg, todayExpenseAgg] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    SaleItem.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$profit' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const [inventoryValueAgg, lowStock, expiringBatches, debtAgg, payableAgg] = await Promise.all([
    Batch.aggregate([
      { $match: { status: 'active', expiryDate: { $gt: new Date() } } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$remainingQuantity', '$purchasePrice'] } } } },
    ]),
    inventoryService.getLowStockMedicines(),
    inventoryService.getExpiringBatches({ days: expiringSoonDays }),
    Customer.aggregate([{ $group: { _id: null, total: { $sum: '$outstandingDebt' } } }]),
    Purchase.aggregate([
      { $match: { status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
    ]),
  ]);

  return {
    todaySales: todaySalesAgg[0]?.total || 0,
    todaySalesCount: todaySalesAgg[0]?.count || 0,
    todayProfit: todayProfitAgg[0]?.total || 0,
    todayExpenses: todayExpenseAgg[0]?.total || 0,
    inventoryValue: inventoryValueAgg[0]?.value || 0,
    lowStockCount: lowStock.length,
    expiringSoonCount: expiringBatches.length,
    outstandingDebt: debtAgg[0]?.total || 0,
    supplierPayables: payableAgg[0]?.total || 0,
  };
}

async function getSalesSeries({ days = 14 } = {}) {
  // Bucketed entirely in UTC (matching $dateToString's default timezone)
  // so the generated day keys always line up with the aggregation's keys,
  // regardless of the server's local timezone offset.
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  from.setUTCDate(from.getUTCDate() - (Number(days) - 1));

  const [revenueRows, profitRows] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
    ]),
    SaleItem.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          profit: { $sum: '$profit' },
        },
      },
    ]),
  ]);

  const revenueMap = new Map(revenueRows.map((r) => [r._id, r.revenue]));
  const profitMap = new Map(profitRows.map((r) => [r._id, r.profit]));

  const series = [];
  for (let i = 0; i < Number(days); i += 1) {
    const d = new Date(from);
    d.setUTCDate(from.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, revenue: revenueMap.get(key) || 0, profit: profitMap.get(key) || 0 });
  }
  return series;
}

async function getTopMedicines({ days = 30, limit = 5 } = {}) {
  const from = new Date();
  from.setDate(from.getDate() - Number(days));

  const rows = await SaleItem.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $group: {
        _id: '$medicine',
        quantitySold: { $sum: '$quantity' },
        revenue: { $sum: '$lineTotal' },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: { from: Medicine.collection.name, localField: '_id', foreignField: '_id', as: 'medicine' },
    },
    { $unwind: '$medicine' },
    { $project: { medicineId: '$_id', name: '$medicine.name', unit: '$medicine.unit', quantitySold: 1, revenue: 1, _id: 0 } },
  ]);
  return rows;
}

async function getSalesByCategory({ days = 30 } = {}) {
  const from = new Date();
  from.setDate(from.getDate() - Number(days));

  const rows = await SaleItem.aggregate([
    { $match: { createdAt: { $gte: from } } },
    { $lookup: { from: Medicine.collection.name, localField: 'medicine', foreignField: '_id', as: 'medicine' } },
    { $unwind: '$medicine' },
    {
      $group: {
        _id: '$medicine.category',
        revenue: { $sum: '$lineTotal' },
      },
    },
    { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $project: { categoryId: '$_id', name: { $ifNull: ['$category.name', 'Uncategorized'] }, revenue: 1, _id: 0 } },
    { $sort: { revenue: -1 } },
  ]);
  return rows;
}

async function getRecentSales(limit = 6) {
  return Sale.find().sort({ createdAt: -1 }).limit(limit).populate('customer', 'name').populate('cashier', 'name').lean();
}

module.exports = { getSummary, getSalesSeries, getTopMedicines, getSalesByCategory, getRecentSales };
