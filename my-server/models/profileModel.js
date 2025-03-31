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
    email: {
      type: String,
      required: true,
    },
  },
}, { timestamps: true });

// ตรวจสอบว่าโมเดลถูกสร้างถูกต้อง
module.exports = mongoose.model('Profile', profileSchema);
