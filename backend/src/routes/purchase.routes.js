const express = require('express');
const { create, list, getById } = require('../controllers/purchase.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.post('/', authorize(PERMISSIONS.PURCHASE_MANAGE), create);
router.get('/', authorize(PERMISSIONS.PURCHASE_VIEW), list);
router.get('/:id', authorize(PERMISSIONS.PURCHASE_VIEW), getById);

module.exports = router;
