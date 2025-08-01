import axios from 'axios';

const API_URL = 'https://hope-i-bot.onrender.com/api/chat';


export const getChats = async (token) => {
  const response = await axios.get(`${API_URL}/list`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getMessages = async (chatId, token) => {
  const response = await axios.get(`${API_URL}/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createChat = async (participantId, token) => {
  const response = await axios.post(
    `${API_URL}/create`,
    { participantId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const sendMessage = async (chatId, content, token) => {
  const response = await axios.post(
    `${API_URL}/send`,
    { chatId, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}; 