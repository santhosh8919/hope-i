const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Get all chats for the authenticated user
router.get('/list', auth, chatController.getChats);

// Get messages for a specific chat
router.get('/:chatId/messages', auth, chatController.getMessages);

// Create a new chat
router.post('/create', auth, chatController.createChat);

// Send a message
router.post('/send', auth, chatController.sendMessage);

module.exports = router; 