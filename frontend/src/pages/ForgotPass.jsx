import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const ForgotPass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpValid, setOtpValid] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Always format phone as 91XXXXXXXXXX
  const getPhoneWithCode = () => {
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    return cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'phone') setPhoneError('');
    if (name === 'otp') setOtpError('');
  };

  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('91')) {
      return /^91[6-9]\d{9}$/.test(cleanPhone);
    }
    return /^[6-9]\d{9}$/.test(cleanPhone);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!validatePhone(cleanPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number with or without country code (91)');
      return;
          }
    try {
      setIsLoading(true);
      setOtpError('');
      const phoneWithCode = getPhoneWithCode();
      console.log('Sending OTP request for:', phoneWithCode);
      
      // Log the request details
      const requestBody = {
        phoneNumber: phoneWithCode.replace('91', ''),
        countryCode: '91'
      };
      console.log('Request body:', requestBody);
      console.log('API URL:', `${API_BASE_URL}${API_ENDPOINTS.AUTH.REQUEST_OTP}`);
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REQUEST_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setOtpSent(true);
        setOtpError('');
      } else {
        setOtpError(data.error || 'Failed to send OTP');
    }
    } catch (error) {
      console.error('OTP request error:', error);
      setOtpError(error.message || 'Failed to connect to the server. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const phoneWithCode = getPhoneWithCode();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_OTP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneWithCode.replace('91', ''),
          countryCode: '91',
          otp: formData.otp
        })
      });
      const data = await response.json();
      if (data.success) {
        setOtpValid(true);
        setOtpError('');
      } else {
        setOtpError(data.error || 'Invalid OTP. Please try again.');
        setOtpValid(false);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('Failed to verify OTP. Please try again.');
      setOtpValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpValid) {
      setOtpError('Please verify OTP before resetting password.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }
    try {
      setIsLoading(true);
      setSuccessMessage('');
      const phoneWithCode = getPhoneWithCode();

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneWithCode,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Password reset successful! Redirecting to login...');
    setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setOtpError(data.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setOtpError('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-20 px-2 min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100">
      <motion.div
        className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-green-200"
        initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">Enter your phone number to reset your password</p>
          </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
              required
            />
            {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
          </div>

          {!otpSent ? (
            <button
                type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter OTP"
                  required
                />
                {otpError && <p className="mt-1 text-sm text-red-600">{otpError}</p>}
              </div>

              {!otpValid ? (
              <button
                type="button"
                  onClick={handleVerifyOtp}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Verify OTP
              </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                      required
                    />
            </div>

              <button
                type="button"
                    onClick={handleResetPassword}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Password
              </button>
                </>
              )}
            </>
          )}
        </form>

        {otpError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{otpError}</p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Sending OTP...</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <p className="text-gray-700">{successMessage}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPass;