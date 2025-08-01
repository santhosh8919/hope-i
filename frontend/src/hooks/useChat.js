import { useState, useEffect, useCallback } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../config/socket';
import { getChats, getMessages, sendMessage as sendMessageService, createChat } from '../services/chatService';

export const useChat = (token) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (token) {
      initializeSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  // Fetch chats
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const chatList = await getChats(token);
      setChats(chatList);
      setError(null);
    } catch (err) {
      setError('Failed to load chats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when chat is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedChat) {
        try {
          setLoading(true);
          const messageList = await getMessages(selectedChat._id || selectedChat.id, token);
          setMessages(messageList);
          setError(null);
        } catch (err) {
          setError('Failed to load messages');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadMessages();
  }, [selectedChat, token]);

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket();
    socket.on('new_message', (data) => {
      if (data.chatId === (selectedChat?._id || selectedChat?.id)) {
        setMessages(prev => [...prev, data.message]);
      }
    });
    return () => {
      socket.off('new_message');
    };
  }, [selectedChat]);

  // Send message
  const sendMessage = useCallback(async (content) => {
    if (!selectedChat || !content.trim()) return;
    try {
      const message = await sendMessageService(selectedChat._id || selectedChat.id, content, token);
      setMessages(prev => [...prev, message]);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  }, [selectedChat, token]);

  // Create new chat
  const startNewChat = useCallback(async (participantId) => {
    try {
      setLoading(true);
      const newChat = await createChat(participantId, token);
      setChats(prev => [...prev, newChat]);
      setSelectedChat(newChat);
      setError(null);
    } catch (err) {
      setError('Failed to create chat');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    chats,
    selectedChat,
    messages,
    loading,
    error,
    setSelectedChat,
    sendMessage,
    startNewChat,
    loadChats
  };
}; 