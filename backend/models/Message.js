const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: String,         // Unique for each user-doctor pair
  senderId: String,     // Who sent the message
  senderType: String,   // 'user' or 'doctor'
  message: String,      // Message content
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);