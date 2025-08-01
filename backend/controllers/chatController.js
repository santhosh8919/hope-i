const Chat = require('../models/Chat');
const User = require('../models/User');

// Get all chats for a user
exports.getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email role')
      .sort({ lastMessage: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'name email role');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id;

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, participantId] }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = new Chat({
      participants: [userId, participantId],
      messages: []
    });

    await chat.save();
    await chat.populate('participants', 'name email role');
    
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
    }

    // Add message
    chat.messages.push({
      sender: userId,
      content
    });
    chat.lastMessage = Date.now();
    await chat.save();

    // Populate sender info
    await chat.populate('messages.sender', 'name email role');

    // Get the last message
    const lastMessage = chat.messages[chat.messages.length - 1];

    // Emit socket event
    req.io.to(chatId).emit('new_message', {
      chatId,
      message: lastMessage
    });

    res.json(lastMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 