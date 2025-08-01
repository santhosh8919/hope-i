import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PermissionRequest = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({
    microphone: false,
    camera: false,
    location: false
  });
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);

  const requestPermissions = async () => {
    try {
      // Request microphone permission
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions(prev => ({ ...prev, microphone: true }));
      micStream.getTracks().forEach(track => track.stop());

      // Request camera permission
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissions(prev => ({ ...prev, camera: true }));
      videoStream.getTracks().forEach(track => track.stop());

      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setPermissions(prev => ({ ...prev, location: true }));
      setLocationData({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      // Store permissions in localStorage with all permissions set to true
      const updatedPermissions = {
        microphone: true,
        camera: true,
        location: true,
        locationData: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        }
      };
      localStorage.setItem('permissions', JSON.stringify(updatedPermissions));

      // Navigate to signup page
      navigate('/signup');
    } catch (err) {
      setError('Failed to get permissions: ' + err.message);
      console.error('Permission request error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Required Permissions
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please grant the following permissions to continue
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="flex items-center p-4 border rounded-t-md">
              <input
                type="checkbox"
                checked={permissions.microphone}
                readOnly
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Microphone Access
              </label>
            </div>
            <div className="flex items-center p-4 border">
              <input
                type="checkbox"
                checked={permissions.camera}
                readOnly
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Camera Access
              </label>
            </div>
            <div className="flex items-center p-4 border rounded-b-md">
              <input
                type="checkbox"
                checked={permissions.location}
                readOnly
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Location Access
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={requestPermissions}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Grant Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest; 