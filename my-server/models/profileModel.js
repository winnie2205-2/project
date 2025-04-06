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
      required: true,  // Add required if needed
    },
    email: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,  // Add required if needed
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);