const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../utils/generateToken');
const auditService = require('../services/audit.service');
const { AVATAR_DIR } = require('../middleware/uploadAvatar');

function buildTokenPayload(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.roleName,
    permissions: user.role.permissions,
    avatarUrl: user.avatarUrl || '',
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash').populate('role');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokenPayload = buildTokenPayload(user);
  setAuthCookie(res, generateToken(tokenPayload));

  await auditService.logAction({
    user: user._id,
    action: 'auth.login',
    resource: 'User',
    resourceId: user._id,
    ip: req.ip,
  });

  res.json({ success: true, data: tokenPayload });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  if (req.user) {
    await auditService.logAction({
      user: req.user.id,
      action: 'auth.logout',
      resource: 'User',
      resourceId: req.user.id,
      ip: req.ip,
    });
  }
  res.json({ success: true, data: null });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('role', 'name permissions');
  if (!user) throw new ApiError(401, 'Session invalid');
  res.json({ success: true, data: buildTokenPayload(user) });
});

// Self-service profile update (name/email). Restricted to Admin and Cashier
// accounts by the `profile.manage` permission (see config/permissions.js) —
// enforced by the `authorize()` middleware on the route, not just hidden in
// the UI. The JWT embeds name/email, so it's reissued after a successful
// update or the topbar/session would keep showing stale values.
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required');
  }

  const user = await User.findById(req.user.id).populate('role');
  if (!user) throw new ApiError(401, 'Session invalid');

  user.name = name;
  user.email = email.toLowerCase();
  await user.save();

  const tokenPayload = buildTokenPayload(user);
  setAuthCookie(res, generateToken(tokenPayload));

  await auditService.logAction({
    user: user._id,
    action: 'profile.updated',
    resource: 'User',
    resourceId: user._id,
    ip: req.ip,
  });

  res.json({ success: true, data: tokenPayload });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters');
  }

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Session invalid');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  await auditService.logAction({
    user: user._id,
    action: 'profile.password_changed',
    resource: 'User',
    resourceId: user._id,
    ip: req.ip,
  });

  res.json({ success: true, data: null });
});

// Replaces the caller's own avatar image. The old file (if any) is removed
// from disk so uploads don't accumulate orphaned images.
const uploadAvatarHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file was uploaded');

  const user = await User.findById(req.user.id).populate('role');
  if (!user) throw new ApiError(401, 'Session invalid');

  if (user.avatarUrl) {
    const oldPath = path.join(AVATAR_DIR, path.basename(user.avatarUrl));
    fs.unlink(oldPath, () => {});
  }

  user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await user.save();

  const tokenPayload = buildTokenPayload(user);
  setAuthCookie(res, generateToken(tokenPayload));

  await auditService.logAction({ user: user._id, action: 'profile.avatar_updated', resource: 'User', resourceId: user._id, ip: req.ip });

  res.json({ success: true, data: tokenPayload });
});

module.exports = { login, logout, me, updateProfile, changePassword, uploadAvatarHandler };
