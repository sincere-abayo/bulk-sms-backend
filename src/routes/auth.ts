import { Router, Request, Response } from 'express';
import { generateToken, generateOTP } from '../utils/auth';
import { UserModel } from '../models/User';

const router = Router();

// Temporary in-memory storage for OTPs (in production, use Redis)
const otpStore: { [phone: string]: string } = {};

// Register/Login with phone number
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    
    if (!phone || !name) {
      return res.status(400).json({ error: 'Phone and name are required' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    otpStore[phone] = otp;
    
    // In production, send OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent to your phone',
      // Remove this in production
      otp: otp 
    });
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

export default router;