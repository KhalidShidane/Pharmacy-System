const mongoose = require('mongoose');
const { ROLES } = require('../config/permissions');

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, enum: ROLES },
    description: { type: String, default: '' },
    permissions: [{ type: String, required: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
