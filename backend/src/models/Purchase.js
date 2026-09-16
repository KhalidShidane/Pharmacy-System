const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem' }],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
