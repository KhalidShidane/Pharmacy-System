const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    country: { type: String, default: '' },
    contact: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
