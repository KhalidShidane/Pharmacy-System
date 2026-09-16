const express = require('express');
const { list, getById, create, update } = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.SUPPLIER_VIEW), list);
router.get('/:id', authorize(PERMISSIONS.SUPPLIER_VIEW), getById);
router.post('/', authorize(PERMISSIONS.SUPPLIER_MANAGE), create);
router.patch('/:id', authorize(PERMISSIONS.SUPPLIER_MANAGE), update);

module.exports = router;
