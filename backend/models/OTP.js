const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
otpSchema.index({ phoneNumber: 1, otp: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to automatically delete expired OTPs

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP; 