const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    batchNumber: { type: String, required: true, trim: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'expired', 'depleted', 'damaged'],
      default: 'active',
    },
  },
  { timestamps: true }
);

batchSchema.index({ medicine: 1, expiryDate: 1 });

module.exports = mongoose.model('Batch', batchSchema);
