const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return_in', 'return_out', 'adjustment', 'damage'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referenceType: { type: String, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
