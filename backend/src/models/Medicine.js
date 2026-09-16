const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    genericName: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    description: { type: String, default: '' },
    dosageForm: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'],
      default: 'tablet',
    },
    strength: { type: String, default: '' },
    unit: { type: String, default: 'unit' },
    barcode: { type: String, unique: true, sparse: true, index: true },
    requiresPrescription: { type: Boolean, default: false },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    minStockLevel: { type: Number, required: true, min: 0, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
