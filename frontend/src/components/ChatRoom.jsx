import React, { useEffect, useState, useRef } from 'react';
import { getSocket } from '../config/socket';
const ChatRoom = ({ room, currentUserId, currentUserType, otherUserName }) => {
    const socket = getSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);


  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Join room and fetch history
  useEffect(() => {
    if (!room) return;
    socket.emit('join_room', { room });

    // Fetch message history
    fetch(`https://hope-i-bot.onrender.com/api/messages/${room}`)

      .then(res => res.json())
      .then(setMessages);

    // Listen for new messages
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cleanup
    return () => {
      socket.off('receive_message');
    };
  }, [room]);

  // Send a message
  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      room,
      message: input,
      senderId: currentUserId,
      senderType: currentUserType
    };
    socket.emit('send_message', msg);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 ${msg.senderId === currentUserId ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.senderId === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <b>{msg.senderId === currentUserId ? 'You' : otherUserName}:</b> {msg.message}
              <div className="text-xs mt-1 opacity-75">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;