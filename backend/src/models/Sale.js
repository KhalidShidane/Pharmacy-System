const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SaleItem' }],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'card', 'other'], required: true },
    status: { type: String, enum: ['paid', 'partial', 'credit'], required: true },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
