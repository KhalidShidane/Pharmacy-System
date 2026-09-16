const express = require('express');
const { get, update } = require('../controllers/setting.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.get('/', get);
router.patch('/', authorize(PERMISSIONS.SETTINGS_MANAGE), update);

module.exports = router;
