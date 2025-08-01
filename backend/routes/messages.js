const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages for a room
router.get('/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort('timestamp');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Insert a new message
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/messages body:', req.body); // Debug log
    let { room, senderId, senderType, message } = req.body;

    // If senderId or senderType is missing, try to fetch from users collection
    if (!senderType && senderId) {
      const user = await User.findOne({ userId: senderId });
      if (user) {
        senderType = user.role || user.type; // role for 'doctor', 'user', etc.
      }
    }

    // If senderId is missing but you have some auth, you could extract from req.user (if using auth middleware)

    const newMsg = new Message({ room, senderId, senderType, message });
    await newMsg.save();
    console.log('Saved message:', newMsg); // Debug log
    res.status(201).json({
      _id: newMsg._id,
      room: newMsg.room,
      senderId: newMsg.senderId,
      senderType: newMsg.senderType,
      message: newMsg.message,
      timestamp: newMsg.timestamp
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

module.exports = router;