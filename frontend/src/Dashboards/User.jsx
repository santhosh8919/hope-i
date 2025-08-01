import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaUserCircle } from "react-icons/fa";
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import ChatRoom from '../components/ChatRoom';
import { initializeSocket, disconnectSocket } from '../config/socket';

const User = () => {
  const [user, setUser] = useState({ userId: '', name: '' });
  const [showBot, setShowBot] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [canLogout, setCanLogout] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [userAppointments, setUserAppointments] = useState([]);
  const [appointmentDoctor, setAppointmentDoctor] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [botMessages, setBotMessages] = useState([]);
  const [chatContacts, setChatContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      initializeSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, []);

  const categories = [
    { id: 'student', name: 'Students', prompt: 'Hi, I am a student. Please help me with my studies and provide guidance on my academic journey.' },
    { id: 'housewife', name: 'House wife', prompt: 'Hi, I am a housewife. Please help me with managing my household and daily activities.' },
    { id: 'software', name: 'Software employee', prompt: 'Hi, I am a software professional. Please help me with technical challenges and career development.' },
    { id: 'faculty', name: 'Faculty', prompt: 'Hi, I am a faculty member. Please help me with teaching methodologies and academic research.' },
    { id: 'business', name: 'Business man', prompt: 'Hi, I am a business person. Please help me with business strategies and management.' },
    { id: 'doctor', name: 'Doctor', prompt: 'Hi, I am a medical professional. Please help me with healthcare-related queries and medical knowledge.' },
    { id: 'bank', name: 'Bank employee', prompt: 'Hi, I am a bank employee. Please help me with financial matters and banking operations.' },
    { id: 'agriculture', name: 'Agriculture workers', prompt: 'Hi, I am an agriculture worker. Please help me with farming techniques and agricultural practices.' },
    { id: 'police', name: 'Police officers', prompt: 'Hi, I am a police officer. Please help me with law enforcement and public safety matters.' },
    { id: 'govt', name: 'Govt employees', prompt: 'Hi, I am a government employee. Please help me with administrative and policy-related matters.' }
  ];

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  // 5 minute logout timer
  useEffect(() => {
    const timer = setTimeout(() => setCanLogout(true), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if category is already selected in localStorage
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
      setSelectedCategory(JSON.parse(savedCategory));
      setShowCategorySelection(false);
    }
  }, []);

  // Fetch doctors for appointment booking
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/doctors/available`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Raw doctor data from API:', response.data);
        setDoctors(response.data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch user's appointments on mount and after booking
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserAppointments(res.data || []);
        if (res.data && res.data.length > 0) {
          // Assume only one active appointment at a time
          setAppointmentDoctor(res.data[0].doctor);
          setAppointmentStatus('The doctor will contact you in your slot.');
        }
      } catch (err) {
        setUserAppointments([]);
      }
    };
    fetchAppointments();
  }, []);

  // Add this new useEffect after the existing useEffects
  useEffect(() => {
    const loadChatContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.length > 0) {
          // Get unique doctor IDs from appointments
          const doctorIds = [...new Set(response.data.map(app => app.doctorId))];
          
          // Fetch doctor details for each unique doctor
          const doctorDetails = await Promise.all(
            doctorIds.map(async (doctorId) => {
              const docResponse = await axios.get(`${API_BASE_URL}/doctors/${doctorId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                id: doctorId,
                name: docResponse.data.name || doctorId,
                type: 'doctor'
              };
            })
          );
          
          setChatContacts(doctorDetails);
        }
      } catch (error) {
        console.error('Error loading chat contacts:', error);
      }
    };

    loadChatContacts();
  }, []);

  // Button handlers
  const handleNav = (path) => navigate(path);
  const handleBot = () => setShowBot(true);
  const handleChat = () => setShowChat(true);
  const handleLogout = () => {
    if (canLogout) {
      // Clear all auth-related data
      localStorage.removeItem('token');
      // Clear any other auth-related state
      setUser({ userId: '', name: '' });
      // Redirect to login page
      navigate('/login', { replace: true });
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategorySelection(false);
    // Save category to localStorage
    localStorage.setItem('selectedCategory', JSON.stringify(category));
    // Set the category prompt in the message input
    setMessage(category.prompt);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setBotMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/bot/chat`,
        {
          message: userMessage,
          category: selectedCategory.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data && response.data.reply) {
        setBotMessages(prev => [...prev, { type: 'bot', content: response.data.reply }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      setBotMessages(prev => [...prev, {
        type: 'error',
        content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const testAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/bot/test`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      let message = 'API Test Results:\n\n';
      message += `Main API: ${response.data.main_api.working ? '✅ Working' : '❌ Not Working'}\n`;
      message += `Alternative API: ${response.data.alternative_api.working ? '✅ Working' : '❌ Not Working'}\n`;
      message += `API Key: ${response.data.api_key_configured ? '✅ Configured' : '❌ Missing'}`;
      
      setMessages(prev => [...prev, { type: 'bot', content: message }]);
    } catch (error) {
      console.error('API Test Error:', error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Failed to test API connection. Please check your internet connection and try again.'
      }]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: 'Chat history cleared. How can I help you today?'
    }]);
  };

  // Add resetCategory function
  const resetCategory = () => {
    setSelectedCategory(null);
    setShowCategorySelection(true);
    setMessages([]);
    setMessage('');
    localStorage.removeItem('selectedCategory');
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    const token = localStorage.getItem('token');
    axios.post(
      `${API_BASE_URL}/bot/chat`,
      {
        message: userMessage,
        category: selectedCategory.id
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
      .then(response => {
        if (response.data && response.data.reply) {
          setMessages(prev => [...prev, { type: 'bot', content: response.data.reply }]);
        } else {
          throw new Error('Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setMessages(prev => [...prev, {
          type: 'error',
          content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.'
        }]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const slots = [
    '6:00 PM - 6:30 PM',
    '6:30 PM - 7:00 PM',
    '7:00 PM - 7:30 PM',
    '7:30 PM - 8:00 PM',
    '8:00 PM - 8:30 PM',
    '8:30 PM - 9:00 PM'
  ];

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingMessage('');
    if (!selectedDoctor || !selectedSlot) {
      setBookingMessage('Please select a doctor and a time slot.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/appointments/book`,
        {
          doctorId: selectedDoctor,
          slot: selectedSlot
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Get doctor details
      const docResponse = await axios.get(`${API_BASE_URL}/doctors/${selectedDoctor}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const doc = {
        id: selectedDoctor,
        name: docResponse.data.name || selectedDoctor,
        type: 'doctor'
      };
      
      // Update chat contacts if doctor not already in list
      if (!chatContacts.some(c => c.id === doc.id)) {
        setChatContacts(prev => [...prev, doc]);
      }
      
      alert('Appointment booked successfully! Your doctor will contact you in your slot.');
      setAppointmentDoctor(doc);
      setSelectedDoctor('');
      setSelectedSlot('');
      setShowBooking(false);
    } catch (error) {
      setBookingMessage(
        error.response?.data?.error || 'Failed to book appointment. Please try again.'
      );
    }
  };

  // Chatroom UI (separate from bot)
  const handleChatSend = () => {
    if (!chatInput.trim() || !selectedChat) return;
    setChatMessages(prev => [
      ...prev,
      { from: 'user', text: chatInput, time: new Date().toLocaleTimeString().slice(0, 5) }
    ]);
    setChatInput('');
  };

  return (
    <div className="relative min-h-screen flex flex-col pt-0">
      {/* Animated, attractive background */}
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full bg-gradient-to-br from-blue-100 via-white to-teal-200">
          <div className="absolute top-0 left-0 w-80 h-80 bg-blue-200 rounded-full opacity-40 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-300 rounded-full opacity-30 blur-2xl animate-pulse" />
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        </div>
      </div>

      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-teal-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/80 rounded-2xl shadow-xl px-10 py-10 flex flex-col items-center"
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 40, opacity: 0 }}
            >
              <FaUser className="text-blue-600 text-6xl mb-4 animate-bounce" />
              <h2 className="text-2xl font-extrabold text-blue-700 mb-1 text-center drop-shadow">
                Welcome to User Dashboard
              </h2>
              <p className="text-base text-gray-700 text-center">
                You are logged in as {user.userId}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard */}
      {!showSplash && (
        <div className="px-2 sm:px-4">
          <div className="min-h-screen flex flex-col">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-2 sm:px-8 py-4 sm:py-6 gap-4 sm:gap-0">
              {/* Welcome */}
              <motion.div
                className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 drop-shadow text-center sm:text-left"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                WELCOME <span className="text-blue-600">{user.userId}</span>
              </motion.div>
              {/* Buttons */}
              <motion.div
                className="flex flex-wrap justify-center gap-2 sm:gap-4"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <button
                  className="bg-gradient-to-r from-pink-400 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition text-sm sm:text-base"
                  onClick={() => window.location.href = "https://llamacoder.together.ai/share/v2/N8tyVcicmdbn1e0s"}
                >
                  Games
                </button>
                <button
                  className="bg-gradient-to-r from-green-400 to-green-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition text-sm sm:text-base"
                  onClick={() => handleNav("/exercise")}
                >
                  Exercises
                </button>
                <button
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition text-sm sm:text-base"
                  onClick={() => handleNav("/moral")}
                >
                  Moral Stories
                </button>
                <button
                  className="bg-gradient-to-r from-blue-400 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition text-sm sm:text-base"
                  onClick={handleBot}
                >
                  Bot
                </button>
                <button
                  className="bg-gradient-to-r from-purple-400 to-purple-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition text-sm sm:text-base"
                  onClick={handleChat}
                >
                  Chat
                </button>
                <button
                  className={`bg-gradient-to-r from-gray-400 to-gray-700 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold shadow-lg transition text-sm sm:text-base ${
                    canLogout
                      ? "hover:scale-105 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={handleLogout}
                  disabled={!canLogout}
                  title={
                    canLogout
                      ? "Logout"
                      : "You can logout after 5 minutes"
                  }
                >
                  Logout
                </button>
              </motion.div>
            </div>

            {/* Center Content */}
            <div className="flex flex-col items-center flex-grow justify-center">
              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-blue-900 mb-6 sm:mb-8 drop-shadow-lg text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                USER DASHBOARD
              </motion.h1>
              {/* 3D Welcoming Image */}
              <motion.img
                src="images/welcome.jpg"
                alt="Welcome User"
                className="w-[220px] sm:w-[350px] md:w-[420px] rounded-3xl shadow-2xl border-8 border-white hover:scale-105 transition duration-500 bg-white"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = "https://static.vecteezy.com/system/resources/previews/009/397/348/original/3d-illustration-of-welcome-text-on-white-background-png.png";
                }}
              />
            </div>

            {/* Bot Modal */}
            <AnimatePresence>
              {showBot && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-4xl h-[90vh] flex flex-col"
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 40, opacity: 0 }}
                  >
                    <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-2xl">
                      <h3 className="text-2xl font-bold">🤖 ChatGPT Assistant</h3>
                      <button
                        onClick={() => setShowBot(false)}
                        className="text-3xl font-bold hover:text-gray-200"
                      >
                        &times;
                      </button>
                    </div>
                    {showCategorySelection ? (
                      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        <h4 className="text-xl font-semibold mb-6 text-center">Please select your category</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleCategorySelect(category)}
                              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                              <span className="text-lg font-medium">{category.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-4 p-6 justify-center">
                          <button
                            onClick={testAPI}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-base transition-colors"
                          >
                            Test API
                          </button>
                          <button
                            onClick={clearChat}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-base transition-colors"
                          >
                            Clear Chat
                          </button>
                          <button
                            onClick={resetCategory}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg text-base transition-colors"
                          >
                            Change Category
                          </button>
                        </div>
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                          {botMessages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-lg p-4 text-lg ${
                                  msg.type === 'user'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                                    : msg.type === 'error'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {isLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white text-gray-800 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">ChatGPT is thinking</span>
                                  <div className="flex gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-6 border-t">
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Type your message here..."
                              className="flex-1 p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                            <button
                              type="submit"
                              disabled={isLoading || !message.trim()}
                              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-lg font-semibold"
                            >
                              Send
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Modal */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-6xl flex flex-col"
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 40, opacity: 0 }}
                  >
                    {/* Chat Header */}
                    <div className="flex justify-between items-center p-4 border-b">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-blue-700">Chat Room</h2>
                        <button
                          className="bg-gradient-to-r from-indigo-400 to-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                          onClick={() => setShowBooking(true)}
                        >
                          Book Appointment
                        </button>
                      </div>
                      <button
                        className="text-2xl font-bold text-gray-400 hover:text-red-500"
                        onClick={() => setShowChat(false)}
                      >
                        &times;
                      </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                      {/* Left Sidebar - Contacts and Appointments */}
                      <div className="w-80 border-r flex flex-col">
                        {/* Contacts Section */}
                        <div className="p-4 border-b">
                          <h3 className="font-semibold text-blue-900 mb-2">Your Doctors</h3>
                          <div className="space-y-2">
                            {chatContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className={`p-2 rounded-lg cursor-pointer ${
                                  selectedChat?.id === contact.id
                                    ? 'bg-blue-100 border-l-4 border-blue-500'
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedChat(contact)}
                              >
                                <div className="font-medium text-blue-900">{contact.name}</div>
                                <div className="text-xs text-gray-500">User ID: {contact.id}</div>
                                <div className="text-xs text-gray-500">{contact.type}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Appointments Section */}
                        <div className="flex-1 overflow-y-auto p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">Appointment History</h3>
                          <div className="space-y-3">
                            {userAppointments.map((appointment) => (
                              <div
                                key={appointment.id}
                                className="bg-white rounded-lg p-3 shadow-sm border border-blue-100"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-blue-900">{appointment.doctorName}</h4>
                                    <p className="text-xs text-gray-600">{appointment.doctorEmail}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    appointment.status === 'booked' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {appointment.status}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  <p>Slot: {appointment.slot}</p>
                                  <p>Booked: {new Date(appointment.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Chat Area */}
                      <div className="flex-1 flex flex-col">
                        {selectedChat ? (
                          <ChatRoom
                            room={[user.userId, selectedChat.id].sort().join('_')}
                            currentUserId={user.userId}
                            currentUserType="user"
                            otherUserName={selectedChat.name}
                          />
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a doctor to start chatting
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {showBooking && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                  <button
                    className="absolute top-2 right-4 text-2xl py-20 font-bold text-gray-400 hover:text-red-500"
                    onClick={() => setShowBooking(false)}
                  >
                    &times;
                  </button>
                  <h2 className="text-xl font-bold text-blue-700 mb-4 text-center">Book an Appointment</h2>
                  <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
                    <div>
                      <label className="block mb-1 font-semibold text-blue-900">Select Doctor</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                        required
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map(doc => (
                          <option key={doc.userId} value={doc.userId}>
                            {doc.userId}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-blue-900">Select Time Slot</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={selectedSlot}
                        onChange={e => setSelectedSlot(e.target.value)}
                        required
                      >
                        <option value="">-- Select Slot --</option>
                        {slots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                      Book Appointment
                    </button>
                    {bookingMessage && (
                      <div className="text-center text-sm mt-2 text-blue-700 font-semibold">{bookingMessage}</div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default User;