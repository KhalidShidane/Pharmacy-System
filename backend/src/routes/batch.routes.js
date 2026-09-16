const express = require('express');
const { update, adjust } = require('../controllers/batch.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.patch('/:id', authorize(PERMISSIONS.BATCH_MANAGE), update);
router.post('/:id/adjust', authorize(PERMISSIONS.INVENTORY_ADJUST), adjust);

module.exports = router;
