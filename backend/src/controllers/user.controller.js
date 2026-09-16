const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

const list = asyncHandler(async (_req, res) => {
  const users = await User.find().populate('role', 'name').sort({ name: 1 });
  res.json({ success: true, data: users });
});

const create = asyncHandler(async (req, res) => {
  const { name, email, password, roleName } = req.body;
  if (!name || !email || !password || !roleName) {
    throw new ApiError(400, 'name, email, password and roleName are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  const role = await Role.findOne({ name: roleName });
  if (!role) throw new ApiError(400, 'Invalid role');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: role._id, roleName: role.name });

  await auditService.logAction({ user: req.user.id, action: 'user.created', resource: 'User', resourceId: user._id, metadata: { roleName }, ip: req.ip });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, roleName: user.roleName } });
});

const setActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  await auditService.logAction({ user: req.user.id, action: 'user.status_changed', resource: 'User', resourceId: user._id, metadata: { isActive }, ip: req.ip });
  res.json({ success: true, data: user });
});

// Admin editing someone ELSE's account (name, email, role). Editing your own
// account goes through /auth/me instead, which deliberately can't touch
// role — changing your own role here could lock you out of the app.
const update = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, 'Use My Profile to edit your own account');
  }

  const { name, email, roleName } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (roleName) {
    const role = await Role.findOne({ name: roleName });
    if (!role) throw new ApiError(400, 'Invalid role');
    user.role = role._id;
    user.roleName = role.name;
  }
  await user.save();

  await auditService.logAction({ user: req.user.id, action: 'user.updated', resource: 'User', resourceId: user._id, metadata: { name, email, roleName }, ip: req.ip });
  res.json({ success: true, data: await user.populate('role', 'name') });
});

const remove = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.roleName === 'admin') {
    const adminCount = await User.countDocuments({ roleName: 'admin' });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot delete the last remaining admin account');
    }
  }

  await user.deleteOne();

  await auditService.logAction({ user: req.user.id, action: 'user.deleted', resource: 'User', resourceId: user._id, metadata: { name: user.name, email: user.email }, ip: req.ip });
  res.json({ success: true, data: null });
});

module.exports = { list, create, update, setActive, remove };
