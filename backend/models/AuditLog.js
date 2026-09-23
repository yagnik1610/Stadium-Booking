const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  entity: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    default: '',
    trim: true
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
