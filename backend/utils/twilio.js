require('dotenv').config();
const twilio = require('twilio');

// Log Twilio configuration status
console.log('Twilio Configuration Status:', {
  hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
  hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
  hasVerifySid: !!process.env.TWILIO_VERIFY_SID,
  verifySid: process.env.TWILIO_VERIFY_SID
});

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const verifyService = process.env.TWILIO_VERIFY_SID;

// For development/testing, generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phoneNumber, countryCode) => {
    try {
        // Clean phone number format
        phoneNumber = phoneNumber.replace(/^\+/, '').replace(/[^0-9]/g, '');
        const fullNumber = `+${countryCode}${phoneNumber}`;
        console.log('Sending OTP to number:', fullNumber); // Debug log
        
        if (!verifyService) {
            throw new Error('Twilio Verify Service ID is not configured');
        }

        console.log('Using Twilio Verify Service:', verifyService);
        
        // Send OTP using Twilio Verify
        const verification = await client.verify.v2.services(verifyService)
            .verifications
            .create({
                to: fullNumber,
                channel: 'sms'
            });
            
        console.log('Twilio send response:', verification); // Debug log
        
        return {
            success: true,
            status: verification.status
        };
    } catch (error) {
        console.error('Failed to send OTP:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo
        });
        return {
            success: false,
            error: error.message
        };
    }
};

const verifyOTP = async (phoneNumber, countryCode, code) => {
    try {
        // Clean phone number format
        phoneNumber = phoneNumber.replace(/^\+/, '').replace(/[^0-9]/g, '');
        const fullNumber = `+${countryCode}${phoneNumber}`;
        console.log('Verifying OTP for number:', fullNumber); // Debug log
        
        if (!verifyService) {
            throw new Error('Twilio Verify Service ID is not configured');
        }

        console.log('Using Twilio Verify Service:', verifyService);
        
        const verificationCheck = await client.verify.v2.services(verifyService)
            .verificationChecks
            .create({
                to: fullNumber,
                code: code
            });
            
        console.log('Twilio verification response:', verificationCheck); // Debug log
        
        return {
            success: verificationCheck.status === 'approved',
            status: verificationCheck.status
        };
    } catch (error) {
        console.error('Failed to verify OTP:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo
        });
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendOTP,
    verifyOTP
};