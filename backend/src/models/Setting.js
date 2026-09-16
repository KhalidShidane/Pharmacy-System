const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'pharmacy_settings' },
    pharmacyName: { type: String, default: 'My Pharmacy' },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 0, min: 0 },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    receiptFooter: { type: String, default: 'Thank you for your purchase.' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
