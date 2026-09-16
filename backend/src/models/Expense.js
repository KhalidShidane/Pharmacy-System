const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['rent', 'electricity', 'salaries', 'transportation', 'maintenance', 'supplies', 'other'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now, index: true },
    description: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'other'], default: 'cash' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
