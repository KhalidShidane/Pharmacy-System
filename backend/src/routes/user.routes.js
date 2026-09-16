const express = require('express');
const { list, create, update, setActive, remove } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect, authorize(PERMISSIONS.USER_MANAGE));
router.get('/', list);
router.post('/', create);
router.patch('/:id', update);
router.patch('/:id/status', setActive);
router.delete('/:id', remove);

module.exports = router;
