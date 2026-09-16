const express = require('express');
const { list, getById, create, update } = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.CUSTOMER_VIEW), list);
router.get('/:id', authorize(PERMISSIONS.CUSTOMER_VIEW), getById);
router.post('/', authorize(PERMISSIONS.CUSTOMER_MANAGE), create);
router.patch('/:id', authorize(PERMISSIONS.CUSTOMER_MANAGE), update);

module.exports = router;
