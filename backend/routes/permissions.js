const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const auth = require('../middleware/auth');

// Request permissions
router.post('/request', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { microphone, camera, location, locationData } = req.body;

    // Check if permissions already exist
    let permission = await Permission.findOne({ userId });

    if (permission) {
      // Update existing permissions
      permission.microphone = microphone;
      permission.camera = camera;
      permission.location = location;
      if (locationData) {
        permission.locationData = {
          ...locationData,
          timestamp: new Date()
        };
      }
      permission.updatedAt = new Date();
    } else {
      // Create new permissions
      permission = new Permission({
        userId,
        microphone,
        camera,
        location,
        locationData: locationData ? {
          ...locationData,
          timestamp: new Date()
        } : undefined
      });
    }

    await permission.save();

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: permission
    });
  } catch (error) {
    console.error('Permission update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permissions'
    });
  }
});

// Get user permissions
router.get('/status', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const permission = await Permission.findOne({ userId });

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'No permissions found for this user'
      });
    }

    res.status(200).json({
      success: true,
      permissions: permission
    });
  } catch (error) {
    console.error('Permission fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
});

module.exports = router; 