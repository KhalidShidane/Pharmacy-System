const express = require('express');
const { login, logout, me, updateProfile, changePassword, uploadAvatarHandler } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/uploadAvatar');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.patch('/me', protect, authorize(PERMISSIONS.PROFILE_MANAGE), updateProfile);
router.post('/change-password', protect, authorize(PERMISSIONS.PROFILE_MANAGE), changePassword);
router.post('/me/avatar', protect, authorize(PERMISSIONS.PROFILE_MANAGE), uploadAvatar, uploadAvatarHandler);

module.exports = router;
