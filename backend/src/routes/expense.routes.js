const express = require('express');
const { list, create, update, remove } = require('../controllers/expense.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.EXPENSE_VIEW), list);
router.post('/', authorize(PERMISSIONS.EXPENSE_MANAGE), create);
router.patch('/:id', authorize(PERMISSIONS.EXPENSE_MANAGE), update);
router.delete('/:id', authorize(PERMISSIONS.EXPENSE_MANAGE), remove);

module.exports = router;
