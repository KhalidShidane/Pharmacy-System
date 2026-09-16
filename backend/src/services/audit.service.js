const AuditLog = require('../models/AuditLog');

async function logAction({ user, action, resource, resourceId, metadata, ip }) {
  try {
    await AuditLog.create({
      user: user || null,
      action,
      resource,
      resourceId: resourceId || undefined,
      metadata: metadata || {},
      ip: ip || '',
    });
  } catch (err) {
    // Auditing must never break the primary operation it's attached to.
    console.error('[audit] failed to write audit log', err.message);
  }
}

module.exports = { logAction };
