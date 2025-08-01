require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const twilio = require('twilio');
const OTP = require('../models/OTP');

const { sendOTP, verifyOTP } = require('../utils/twilio');

// Check environment variables
if (
  !process.env.JWT_SECRET ||
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_VERIFY_SID
) {
  console.error("❌ Missing environment variables. Check .env setup.");
  process.exit(1);
}

// 📲 Request OTP (uses utility)
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body;
    console.log('Received OTP request:', { phoneNumber, countryCode }); // Debug log

    if (!phoneNumber || !countryCode) {
      console.log('Missing required fields:', { phoneNumber, countryCode }); // Debug log
      return res.status(400).json({
        error: 'Phone number and country code are required',
        success: false
      });
    }

    // Clean phone number format
    const cleanPhoneNumber = phoneNumber.replace(/^\+/, '').replace(/[^0-9]/g, '');
    console.log('Cleaned phone number:', cleanPhoneNumber); // Debug log

    // Check Twilio configuration
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SID) {
      console.error('Missing Twilio configuration:', {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasVerifySid: !!process.env.TWILIO_VERIFY_SID
      });
      return res.status(500).json({
        success: false,
        error: 'SMS service configuration is missing'
      });
    }

    const result = await sendOTP(cleanPhoneNumber, countryCode);
    console.log('OTP send result:', result); // Debug log

    if (result.success) {
      res.status(200).json({
        success: true,
        status: result.status,
        message: 'OTP sent successfully'
      });
    } else {
      console.error('Failed to send OTP:', result.error); // Debug log
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('OTP request error:', error); // Debug log
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send OTP'
    });
  }
});

// ✅ Verify OTP (uses utility)
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, countryCode, otp } = req.body;
    console.log('Received OTP verification request:', { phoneNumber, countryCode, otp }); // Debug log

    if (!phoneNumber || !countryCode || !otp) {
      console.log('Missing required fields:', { phoneNumber, countryCode, otp }); // Debug log
      return res.status(400).json({
        error: 'Phone number, country code, and OTP are required',
        success: false
      });
    }

    // Clean phone number format - remove country code if present
    const cleanPhoneNumber = phoneNumber.replace(/^\+/, '').replace(/^91/, '').replace(/[^0-9]/g, '');
    console.log('Cleaned phone number:', cleanPhoneNumber); // Debug log

    // Verify OTP using Twilio
    const result = await verifyOTP(cleanPhoneNumber, countryCode, otp);
    console.log('OTP verification result:', result); // Debug log

    if (result.success) {
      // Store verification status in database
      const verification = new OTP({
        phoneNumber: cleanPhoneNumber,
        otp: otp,
        isVerified: true,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      await verification.save();
      console.log('OTP verification stored in database');

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        status: result.status
      });
    } else {
      console.log('OTP verification failed:', result); // Debug log
      res.status(400).json({
        success: false,
        error: result.error || 'Invalid OTP',
        status: result.status
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error); // Debug log
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

// 🧾 Register User
router.post('/register', async (req, res) => {
  try {
    let { phoneNumber, name, email, password, otp } = req.body;
    console.log('Registration request received:', { phoneNumber, name, email });

    // Clean phone number format
    phoneNumber = phoneNumber.replace(/^\+/, '').replace(/[^0-9]/g, '');
    if (!phoneNumber.startsWith('91')) {
      phoneNumber = `91${phoneNumber}`;
    }
    console.log('Cleaned phone number for registration:', phoneNumber);

    if (!phoneNumber || !name || !email || !password || !otp) {
      console.log('Missing required fields:', { phoneNumber, name, email, hasPassword: !!password, hasOtp: !!otp });
      return res.status(400).json({ error: 'All fields are required', success: false });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log('User already exists with phone number:', phoneNumber);
      return res.status(400).json({ error: 'User already exists', success: false });
    }

    // Create user with plain password
    const user = new User({
      userId: `user_${Date.now()}`,
      phoneNumber,
      name,
      email,
      password: password,
      role: 'user',
      isActive: true,
      lastLogin: new Date()
    });

    await user.save();
    console.log('User created successfully:', {
      userId: user.userId,
      email: user.email
    });

    // Save permissions if they exist in the request
    if (req.body.permissions) {
      const Permission = require('../models/Permission');
      const permission = new Permission({
        userId: user.userId,
        microphone: true,
        camera: true,
        location: true,
        locationData: req.body.permissions.locationData,
        grantedAt: new Date(),
        updatedAt: new Date()
      });
      await permission.save();
      console.log('Permissions saved for user:', user.userId);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Send Welcome Message (optional)
    try {
      if (process.env.TWILIO_PHONE_NUMBER) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `Welcome to Hope-AI! Your account has been successfully created.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+${phoneNumber}`
        });
      }
    } catch (twilioError) {
      console.error('⚠️ Failed to send welcome SMS:', twilioError.message);
    }

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login Route with plain password comparison
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    console.log('User found:', {
      userId: user.userId,
      email: user.email
    });

    // Direct password comparison
    if (password !== user.password) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ error: 'Invalid credentials', success: false });
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await User.findOneAndUpdate(
      { email },
      { $set: { lastLogin: new Date() } }
    );

    console.log('Login successful for user:', email);

    res.status(200).json({
      token,
      userId: user.userId,
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get current user data
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Reset password with OTP verification
router.post('/reset-password', async (req, res) => {
  try {
    const { phoneNumber, otp, newPassword } = req.body;
    console.log('Reset password request:', { phoneNumber, otp, hasNewPassword: !!newPassword });

    if (!phoneNumber || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, OTP, and new password are required'
      });
    }

    // Clean phone number format - remove country code if present
    const cleanPhoneNumber = phoneNumber.replace(/^\+/, '').replace(/^91/, '').replace(/[^0-9]/g, '');
    console.log('Cleaned phone number:', cleanPhoneNumber);

    // Find user by phone number (try both with and without country code)
    const user = await User.findOne({
      $or: [
        { phoneNumber: cleanPhoneNumber },
        { phoneNumber: `91${cleanPhoneNumber}` }
      ]
    });

    if (!user) {
      console.log('User not found for phone number:', cleanPhoneNumber);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if OTP was verified recently
    const verification = await OTP.findOne({
      phoneNumber: cleanPhoneNumber,
      otp: otp,
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      console.log('No valid verification found for:', {
        phoneNumber: cleanPhoneNumber,
        otp: otp,
        time: new Date()
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP verification'
      });
    }

    // Update user's password without hashing
    user.password = newPassword;
    await user.save();
    console.log('Password updated for user:', user.userId);

    // Delete used verification
    await OTP.deleteOne({ _id: verification._id });

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
