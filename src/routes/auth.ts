import { Router, Request, Response } from 'express';
import { generateToken, generateOTP } from '../utils/auth';
import { UserModel } from '../models/User';
import axios from 'axios';

const router = Router();

// Temporary in-memory storage for OTPs (in production, use Redis)
const otpStore: { [phone: string]: string } = {};

// Function to send SMS via Africa's Talking
const sendSMS = async (phone: string, message: string) => {
  try {
    // Ensure phone number is in international format
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      // Assume Rwanda (+250) if no country code
      formattedPhone = `+250${phone}`;
    }

    console.log(`Sending SMS to: ${formattedPhone}`);

    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging/bulk',
      {
        username: process.env.AFRICASTALKING_USERNAME,
        message: message,
        phoneNumbers: [formattedPhone]
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apiKey': process.env.AFRICASTALKING_API_KEY
        }
      }
    );

    console.log('SMS sent successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('SMS sending failed:', error.response?.data || error.message);
    throw error;
  }
};

// Register/Login with phone number
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    // Check if user exists
    const existingUser = await UserModel.findByPhone(phone);

    if (existingUser) {
      // User exists, generate token and return
      const token = generateToken(existingUser.id);
      res.json({
        userExists: true,
        token,
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          name: existingUser.name,
          email: existingUser.email
        }
      });
    } else {
      // User doesn't exist, generate OTP
      const otp = generateOTP();
      otpStore[phone] = otp;

      try {
        // Send OTP via Africa's Talking SMS
        await sendSMS(phone, `Your BulkSMS Pro verification code is: ${otp}`);

        res.json({
          userExists: false,
          message: 'OTP sent to your phone',
          // Keep OTP in response for development/demo purposes
          otp: otp
        });
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
        // Still return success but log the error
        res.json({
          userExists: false,
          message: 'OTP generated (SMS failed - check credentials)',
          otp: otp
        });
      }
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and complete registration/login
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp, name } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    if (otpStore[phone] !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Remove used OTP
    delete otpStore[phone];
    
    // Find or create user in database
    let user = await UserModel.findByPhone(phone);
    if (!user) {
      user = await UserModel.create({
        id: Date.now().toString(),
        phone,
        name: name || 'User',
        email: undefined
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test SMS endpoint
router.post('/test-sms', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const result = await sendSMS(phone, message);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;