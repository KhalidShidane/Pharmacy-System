const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['low_stock', 'expiring', 'expired', 'debt', 'payable', 'sale', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    isRead: { type: Boolean, default: false },
    targetRole: { type: String, default: null },
    relatedResourceType: { type: String, default: '' },
    relatedResourceId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
