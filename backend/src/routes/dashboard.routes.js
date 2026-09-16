const express = require('express');
const { summary, salesSeries, topMedicines, salesByCategory, recentSales } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect, authorize(PERMISSIONS.DASHBOARD_VIEW));
router.get('/summary', summary);
router.get('/sales-series', salesSeries);
router.get('/top-medicines', topMedicines);
router.get('/sales-by-category', salesByCategory);
router.get('/recent-sales', recentSales);

module.exports = router;
