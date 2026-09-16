const asyncHandler = require('express-async-handler');
const dashboardService = require('../services/dashboard.service');

const summary = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getSummary();
  res.json({ success: true, data });
});

const salesSeries = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSalesSeries({ days: req.query.days });
  res.json({ success: true, data });
});

const topMedicines = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopMedicines({ days: req.query.days, limit: req.query.limit });
  res.json({ success: true, data });
});

const salesByCategory = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSalesByCategory({ days: req.query.days });
  res.json({ success: true, data });
});

const recentSales = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentSales(Number(req.query.limit) || 6);
  res.json({ success: true, data });
});

module.exports = { summary, salesSeries, topMedicines, salesByCategory, recentSales };
