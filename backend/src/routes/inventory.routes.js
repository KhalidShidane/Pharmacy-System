const express = require('express');
const { summary, lowStock, expiring, transactions } = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect, authorize(PERMISSIONS.INVENTORY_VIEW));
router.get('/summary', summary);
router.get('/low-stock', lowStock);
router.get('/expiring', expiring);
router.get('/transactions', transactions);

module.exports = router;
