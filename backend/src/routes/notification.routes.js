const express = require('express');
const { alerts } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/alerts', alerts);

module.exports = router;
