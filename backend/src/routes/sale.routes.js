const express = require('express');
const { create, list, getById } = require('../controllers/sale.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.post('/', authorize(PERMISSIONS.SALE_CREATE), create);
router.get('/', authorize(PERMISSIONS.SALE_VIEW), list);
router.get('/:id', authorize(PERMISSIONS.SALE_VIEW), getById);

module.exports = router;
