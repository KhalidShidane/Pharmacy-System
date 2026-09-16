const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    partyType: { type: String, enum: ['customer', 'supplier'], required: true },
    party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
    partyModel: { type: String, enum: ['Customer', 'Supplier'], required: true },
    direction: { type: String, enum: ['in', 'out'], required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['cash', 'card', 'bank_transfer', 'other'], default: 'cash' },
    referenceType: { type: String, enum: ['sale', 'purchase', 'manual'], default: 'manual' },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, required: true, default: Date.now, index: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
