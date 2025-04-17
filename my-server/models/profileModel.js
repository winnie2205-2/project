const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    required: true,
  },
  contactInfo: {
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    salesPhone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,
    },
  },
  defaultLocation: {
    type: String,
    enum: ['warehouse1', 'warehouse2', 'all'], // จำกัดเฉพาะค่าที่อนุญาต
    default: 'all', // ค่าเริ่มต้น
  },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
