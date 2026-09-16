const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema(
  {
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    items: [
      {
        purchaseItem: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem', required: true },
        quantity: { type: Number, required: true, min: 1 },
        reason: { type: String, default: '' },
      },
    ],
    refundAmount: { type: Number, required: true, min: 0 },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
