const express = require('express');
const controller = require('../controllers/reports.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect, authorize(PERMISSIONS.REPORTS_VIEW));
router.get('/sales-summary', controller.salesSummary);
router.get('/profit-loss', controller.profitLoss);
router.get('/purchases-summary', controller.purchasesSummary);
router.get('/inventory-valuation', controller.inventoryValuation);
router.get('/best-sellers', controller.bestSellers);
router.get('/customer-debts', controller.customerDebts);
router.get('/supplier-payables', controller.supplierPayables);
router.get('/expenses', controller.expensesReport);
router.get('/payment-history', controller.paymentHistory);
router.get('/low-stock', controller.lowStock);
router.get('/expiring', controller.expiring);

module.exports = router;
