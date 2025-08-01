const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Get current user's appointments
router.get('/my', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId });
    
    // Fetch doctor details for each appointment
    const detailedAppointments = await Promise.all(
      appointments.map(async (app) => {
        const doctor = await User.findOne({ userId: app.doctorId });
        return {
          id: app._id,
          doctorId: app.doctorId,
          doctorName: doctor ? doctor.name : app.doctorId,
          doctorEmail: doctor ? doctor.email : '',
          slot: app.slot,
          createdAt: app.createdAt,
          status: app.status || 'booked'
        };
      })
    );
    
    res.status(200).json(detailedAppointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Book an appointment
router.post('/book', auth, async (req, res) => {
  try {
    const { doctorId, slot } = req.body;
    if (!doctorId || !slot) {
      return res.status(400).json({ error: 'Doctor ID and slot are required' });
    }

    // You may want to add more logic here, like checking if the slot is available

    const appointment = new Appointment({
      userId: req.userId,
      doctorId,
      slot,
      status: 'booked', // or whatever status you use
      createdAt: new Date()
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get all appointments for the logged-in doctor, with user details
router.get('/doctor', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.userId });
    // Fetch user details for each appointment
    const detailedAppointments = await Promise.all(
      appointments.map(async (app) => {
        const user = await User.findOne({ userId: app.userId });
        return {
          id: app._id,
          userId: app.userId,
          username: user ? user.name : app.userId,
          email: user ? user.email : '',
          date: app.createdAt,
          slot: app.slot,
        };
      })
    );
    res.status(200).json(detailedAppointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor appointments' });
  }
});

// Get all appointments for the logged-in doctor, return only userId, slot, and createdAt
router.get('/doctor/summary', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.userId });
    const summary = appointments.map(app => ({
      userId: app.userId,
      slot: app.slot,
      time: app.createdAt
    }));
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor appointments summary' });
  }
});

module.exports = router; 