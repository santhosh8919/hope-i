const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get available doctors (accessible to all authenticated users)
router.get('/available', auth, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('userId')
      .sort({ name: 1 });
    res.status(200).send(doctors);
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).send({ error: 'Failed to fetch available doctors' });
  }
});

// Get doctor details by ID
router.get('/:doctorId', auth, async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      userId: req.params.doctorId,
      role: 'doctor'
    }).select('userId name email');
    
    if (!doctor) {
      return res.status(404).send({ error: 'Doctor not found' });
    }
    
    res.status(200).send(doctor);
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    res.status(500).send({ error: 'Failed to fetch doctor details' });
  }
});

module.exports = router; 