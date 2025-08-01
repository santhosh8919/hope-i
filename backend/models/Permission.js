const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  microphone: {
    type: Boolean,
    default: false
  },
  camera: {
    type: Boolean,
    default: false
  },
  location: {
    type: Boolean,
    default: false
  },
  locationData: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission; 