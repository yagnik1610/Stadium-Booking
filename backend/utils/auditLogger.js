const AuditLog = require('../models/AuditLog');

const logAdminAction = async (adminId, action, entity, entityId = '', details = '', req = null) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';
    await AuditLog.create({
      admin: adminId,
      action,
      entity,
      entityId: String(entityId),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = { logAdminAction };
