const express = require('express');
const { list, create, update, remove } = require('../controllers/manufacturer.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', authorize(PERMISSIONS.MEDICINE_VIEW), list);
router.post('/', authorize(PERMISSIONS.MEDICINE_MANAGE), create);
router.patch('/:id', authorize(PERMISSIONS.MEDICINE_MANAGE), update);
router.delete('/:id', authorize(PERMISSIONS.MEDICINE_MANAGE), remove);

module.exports = router;
