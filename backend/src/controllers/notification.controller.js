const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const inventoryService = require('../services/inventory.service');

// Phase 1: alerts are computed live from current data rather than a persisted
// Notification feed, so the topbar bell always reflects real state. A full
// notification center (persisted, markable-as-read) is a later phase.
const alerts = asyncHandler(async (_req, res) => {
  const [lowStock, expiringSoon, expired, overLimitCustomers] = await Promise.all([
    inventoryService.getLowStockMedicines(),
    inventoryService.getExpiringBatches(),
    inventoryService.getExpiredBatches(),
    Customer.find({ $expr: { $gt: ['$outstandingDebt', '$creditLimit'] }, outstandingDebt: { $gt: 0 } }).lean(),
  ]);

  const alertsList = [
    ...lowStock.map((m) => ({
      id: `low_stock_${m._id}`,
      type: 'low_stock',
      severity: m.currentStock === 0 ? 'critical' : 'warning',
      title: m.currentStock === 0 ? 'Out of stock' : 'Low stock',
      message: `${m.name} — ${m.currentStock} ${m.unit || 'unit'}(s) left (minimum ${m.minStockLevel})`,
      createdAt: new Date(),
    })),
    ...expiringSoon.map((b) => ({
      id: `expiring_${b._id}`,
      type: 'expiring',
      severity: 'warning',
      title: 'Expiring soon',
      message: `${b.medicine?.name || 'Medicine'} batch ${b.batchNumber} expires ${new Date(b.expiryDate).toLocaleDateString()}`,
      createdAt: new Date(),
    })),
    ...expired.map((b) => ({
      id: `expired_${b._id}`,
      type: 'expired',
      severity: 'critical',
      title: 'Expired stock',
      message: `${b.medicine?.name || 'Medicine'} batch ${b.batchNumber} expired ${new Date(b.expiryDate).toLocaleDateString()} — remove from sale`,
      createdAt: new Date(),
    })),
    ...overLimitCustomers.map((c) => ({
      id: `debt_${c._id}`,
      type: 'debt',
      severity: 'warning',
      title: 'Customer over credit limit',
      message: `${c.name} owes ${c.outstandingDebt.toFixed(2)} (limit ${c.creditLimit.toFixed(2)})`,
      createdAt: new Date(),
    })),
  ];

  res.json({ success: true, data: alertsList });
});

module.exports = { alerts };
