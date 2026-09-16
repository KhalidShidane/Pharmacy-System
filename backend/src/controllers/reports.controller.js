const asyncHandler = require('express-async-handler');
const reportsService = require('../services/reports.service');

const wrap = (fn) =>
  asyncHandler(async (req, res) => {
    const data = await fn(req.query);
    res.json({ success: true, data });
  });

module.exports = {
  salesSummary: wrap(reportsService.salesSummary),
  profitLoss: wrap(reportsService.profitLoss),
  purchasesSummary: wrap(reportsService.purchasesSummary),
  inventoryValuation: wrap(reportsService.inventoryValuation),
  bestSellers: wrap(reportsService.bestSellers),
  customerDebts: wrap(reportsService.customerDebts),
  supplierPayables: wrap(reportsService.supplierPayables),
  expensesReport: wrap(reportsService.expensesReport),
  paymentHistory: wrap(reportsService.paymentHistory),
  lowStock: wrap(reportsService.lowStock),
  expiring: wrap(reportsService.expiring),
};
