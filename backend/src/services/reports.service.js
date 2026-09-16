const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Batch = require('../models/Batch');
const inventoryService = require('./inventory.service');

function dateRange({ from, to }) {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : undefined;
}

async function salesSummary({ from, to }) {
  const createdAt = dateRange({ from, to });
  const match = createdAt ? { createdAt } : {};

  const [rows, totals] = await Promise.all([
    Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          discount: { $sum: '$discount' },
          tax: { $sum: '$tax' },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Sale.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: '$total' }, discount: { $sum: '$discount' }, tax: { $sum: '$tax' }, transactions: { $sum: 1 } } },
    ]),
  ]);

  return {
    rows: rows.map((r) => ({ date: r._id, revenue: r.revenue, discount: r.discount, tax: r.tax, transactions: r.transactions })),
    totals: totals[0] || { revenue: 0, discount: 0, tax: 0, transactions: 0 },
  };
}

async function profitLoss({ from, to }) {
  const createdAt = dateRange({ from, to });
  const saleMatch = createdAt ? { createdAt } : {};
  const dateFilter = dateRange({ from, to });
  const expenseMatch = dateFilter ? { date: dateFilter } : {};

  const [saleAgg, itemAgg, expenseAgg] = await Promise.all([
    Sale.aggregate([{ $match: saleMatch }, { $group: { _id: null, orderDiscounts: { $sum: '$discount' } } }]),
    SaleItem.aggregate([
      { $match: createdAt ? { createdAt } : {} },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$lineTotal' },
          cogs: { $sum: { $multiply: ['$unitCost', '$quantity'] } },
          itemProfit: { $sum: '$profit' },
        },
      },
    ]),
    Expense.aggregate([{ $match: expenseMatch }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const grossRevenue = itemAgg[0]?.grossRevenue || 0;
  const cogs = itemAgg[0]?.cogs || 0;
  const orderDiscounts = saleAgg[0]?.orderDiscounts || 0;
  const netRevenue = grossRevenue - orderDiscounts;
  const grossProfit = (itemAgg[0]?.itemProfit || 0) - orderDiscounts;
  const expenses = expenseAgg[0]?.total || 0;
  const netProfit = grossProfit - expenses;

  return { grossRevenue, orderDiscounts, netRevenue, cogs, grossProfit, expenses, netProfit };
}

async function purchasesSummary({ from, to }) {
  const createdAt = dateRange({ from, to });
  const match = createdAt ? { createdAt } : {};

  const [bySupplier, totals] = await Promise.all([
    Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$supplier',
          purchaseCount: { $sum: 1 },
          total: { $sum: '$total' },
          amountPaid: { $sum: '$amountPaid' },
        },
      },
      { $lookup: { from: Supplier.collection.name, localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      {
        $project: {
          _id: 0,
          supplierId: '$_id',
          name: '$supplier.name',
          purchaseCount: 1,
          total: 1,
          amountPaid: 1,
          payable: { $subtract: ['$total', '$amountPaid'] },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Purchase.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' }, amountPaid: { $sum: '$amountPaid' }, count: { $sum: 1 } } }]),
  ]);

  return { rows: bySupplier, totals: totals[0] || { total: 0, amountPaid: 0, count: 0 } };
}

async function inventoryValuation() {
  const rows = await Batch.aggregate([
    { $match: { status: 'active', expiryDate: { $gt: new Date() } } },
    { $group: { _id: '$medicine', quantity: { $sum: '$remainingQuantity' }, value: { $sum: { $multiply: ['$remainingQuantity', '$purchasePrice'] } } } },
    { $lookup: { from: Medicine.collection.name, localField: '_id', foreignField: '_id', as: 'medicine' } },
    { $unwind: '$medicine' },
    { $lookup: { from: Category.collection.name, localField: 'medicine.category', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        medicineId: '$_id',
        name: '$medicine.name',
        unit: '$medicine.unit',
        category: { $ifNull: ['$category.name', 'Uncategorized'] },
        quantity: 1,
        value: 1,
      },
    },
    { $sort: { value: -1 } },
  ]);
  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  return { rows, totalValue };
}

async function bestSellers({ from, to, limit = 20 }) {
  const createdAt = dateRange({ from, to });
  const rows = await SaleItem.aggregate([
    { $match: createdAt ? { createdAt } : {} },
    { $group: { _id: '$medicine', quantitySold: { $sum: '$quantity' }, revenue: { $sum: '$lineTotal' }, profit: { $sum: '$profit' } } },
    { $sort: { quantitySold: -1 } },
    { $limit: Number(limit) },
    { $lookup: { from: Medicine.collection.name, localField: '_id', foreignField: '_id', as: 'medicine' } },
    { $unwind: '$medicine' },
    { $project: { _id: 0, medicineId: '$_id', name: '$medicine.name', unit: '$medicine.unit', quantitySold: 1, revenue: 1, profit: 1 } },
  ]);
  return rows;
}

async function customerDebts() {
  const rows = await Customer.find({ outstandingDebt: { $gt: 0 } }).sort({ outstandingDebt: -1 }).lean();
  const total = rows.reduce((sum, r) => sum + r.outstandingDebt, 0);
  return { rows, total };
}

async function supplierPayables() {
  const rows = await Purchase.aggregate([
    { $match: { status: { $in: ['pending', 'partial'] } } },
    { $group: { _id: '$supplier', payable: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
    { $match: { payable: { $gt: 0 } } },
    { $lookup: { from: Supplier.collection.name, localField: '_id', foreignField: '_id', as: 'supplier' } },
    { $unwind: '$supplier' },
    { $project: { _id: 0, supplierId: '$_id', name: '$supplier.name', phone: '$supplier.phone', payable: 1 } },
    { $sort: { payable: -1 } },
  ]);
  const total = rows.reduce((sum, r) => sum + r.payable, 0);
  return { rows, total };
}

async function expensesReport({ from, to }) {
  const date = dateRange({ from, to });
  const match = date ? { date } : {};

  const [byCategory, rows, totals] = await Promise.all([
    Expense.aggregate([{ $match: match }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]),
    Expense.find(match).sort({ date: -1 }).populate('createdBy', 'name').lean(),
    Expense.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  return { byCategory, rows, total: totals[0]?.total || 0 };
}

async function paymentHistory({ from, to, partyType }) {
  const date = dateRange({ from, to });
  const match = {};
  if (date) match.date = date;
  if (partyType) match.partyType = partyType;

  const rows = await Payment.find(match)
    .sort({ date: -1 })
    .populate('recordedBy', 'name')
    .populate('party')
    .lean();

  return rows.map((p) => ({
    ...p,
    partyName: p.party?.name || '—',
  }));
}

async function lowStock() {
  return inventoryService.getLowStockMedicines();
}

async function expiring() {
  const [expiringSoon, expired] = await Promise.all([inventoryService.getExpiringBatches(), inventoryService.getExpiredBatches()]);
  return { expiringSoon, expired };
}

module.exports = {
  salesSummary,
  profitLoss,
  purchasesSummary,
  inventoryValuation,
  bestSellers,
  customerDebts,
  supplierPayables,
  expensesReport,
  paymentHistory,
  lowStock,
  expiring,
};
