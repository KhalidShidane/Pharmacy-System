const express = require('express');
const { list, getById, create, update, remove, addBatch } = require('../controllers/medicine.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.MEDICINE_VIEW), list);
router.get('/:id', authorize(PERMISSIONS.MEDICINE_VIEW), getById);
router.post('/', authorize(PERMISSIONS.MEDICINE_MANAGE), create);
router.patch('/:id', authorize(PERMISSIONS.MEDICINE_MANAGE), update);
router.delete('/:id', authorize(PERMISSIONS.MEDICINE_MANAGE), remove);
router.post('/:id/batches', authorize(PERMISSIONS.BATCH_MANAGE), addBatch);

module.exports = router;
