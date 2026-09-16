const mongoose = require('mongoose');

const saleReturnSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    items: [
      {
        saleItem: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        reason: { type: String, default: '' },
      },
    ],
    refundAmount: { type: Number, required: true, min: 0 },
    restockedToInventory: { type: Boolean, default: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SaleReturn', saleReturnSchema);
