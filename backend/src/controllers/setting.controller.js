const asyncHandler = require('express-async-handler');
const Setting = require('../models/Setting');
const auditService = require('../services/audit.service');

const get = asyncHandler(async (_req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({ key: 'pharmacy_settings' });
  res.json({ success: true, data: settings });
});

const update = asyncHandler(async (req, res) => {
  const { key, ...updates } = req.body;
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({ key: 'pharmacy_settings', ...updates });
  else {
    Object.assign(settings, updates);
    await settings.save();
  }
  await auditService.logAction({ user: req.user.id, action: 'settings.updated', resource: 'Setting', resourceId: settings._id, ip: req.ip });
  res.json({ success: true, data: settings });
});

module.exports = { get, update };
