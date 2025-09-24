import { Router, Request, Response } from 'express';
import { generateToken, generateOTP } from '../utils/auth';
import { UserModel } from '../models/User';
import { ContactModel } from '../models/Contact';
import { ContactGroupModel } from '../models/ContactGroup';
import { MessageModel, MessageRecipientModel } from '../models/Message';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// Temporary in-memory storage for OTPs (in production, use Redis)
const otpStore: { [phone: string]: string } = {};

// Function to send SMS via Africa's Talking
const sendSMS = async (phone: string, message: string) => {
  try {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Invalid phone number provided');
    }

    // Ensure phone number is in international format
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      // Assume Rwanda (+250) if no country code
      formattedPhone = `+250${formattedPhone}`;
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
        // Send OTP via Africa's Talking SMS (with SMS Retriever format)
        await sendSMS(phone, `<#> Your BulkSMS Pro verification code is: ${otp}\n\nThis code will expire in 10 minutes.`);

        res.json({
          userExists: false,
          message: 'OTP sent to your phone'
        });
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
        res.status(500).json({
          error: 'Failed to send SMS. Please try again.'
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

// Send bulk SMS messages
router.post('/send-sms', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, recipients } = req.body;

    if (!message || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Message and recipients array are required' });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'At least one recipient is required' });
    }

    const userId = req.userId!;
    const smsCount = Math.ceil(message.length / 160) || 1;
    const costPerSMS = 15; // RWF
    const totalCost = recipients.length * smsCount * costPerSMS;

    // Create message record
    const messageRecord = await MessageModel.create({
      userId,
      content: message,
      smsCount,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      cost: totalCost
    });

    const results = [];
    const errors = [];
    let sentCount = 0;
    let failedCount = 0;

    // Create recipient records
    const recipientInputs = recipients.map(recipient => ({
      messageId: messageRecord.id,
      contactId: recipient.contactId,
      name: recipient.name,
      phone: recipient.phone,
      status: 'pending' as const
    }));

    const recipientRecords = await MessageRecipientModel.createBulk(recipientInputs);

    // Send SMS to each recipient
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const recipientRecord = recipientRecords[i];

      try {
        const result = await sendSMS(recipient.phone, message);
        sentCount++;

        // Update recipient status
        await MessageRecipientModel.updateStatus(
          recipientRecord.id,
          'sent',
          undefined,
          new Date()
        );

        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'sent',
          result
        });
      } catch (error: any) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        failedCount++;

        // Update recipient status with error
        await MessageRecipientModel.updateStatus(
          recipientRecord.id,
          'failed',
          error.message
        );

        errors.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update message status
    const finalStatus = failedCount === 0 ? 'completed' :
                       sentCount === 0 ? 'failed' : 'partial';
    await MessageModel.updateStatus(messageRecord.id, finalStatus, sentCount, failedCount);

    res.json({
      success: true,
      messageId: messageRecord.id,
      totalRecipients: recipients.length,
      sent: sentCount,
      failed: failedCount,
      cost: totalCost,
      results,
      errors
    });
  } catch (error: any) {
    console.error('Error in send-sms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact Management Routes
router.get('/contacts', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const contacts = await ContactModel.findByUserId(userId);
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/contacts', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, source } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const userId = req.userId!;
    const contact = await ContactModel.create({
      userId,
      name,
      phone,
      source: source || 'manual',
      hashPhone: ContactModel.hashPhone(phone),
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/contacts/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const userId = req.userId!;

    // First check if the contact belongs to the user
    const existingContact = await ContactModel.findById(id);
    if (!existingContact || existingContact.userId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = await ContactModel.update(id, { name, phone });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/contacts/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // First check if the contact belongs to the user
    const existingContact = await ContactModel.findById(id);
    if (!existingContact || existingContact.userId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const deleted = await ContactModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/contacts/bulk', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    const userId = req.userId!;
    const newContacts = await ContactModel.bulkCreate(userId, contacts);

    res.status(201).json({ contacts: newContacts });
  } catch (error) {
    console.error('Error bulk creating contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Contact Groups Routes
router.get('/contact-groups', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const groups = await ContactGroupModel.findByUserId(userId);
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching contact groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/contact-groups', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const userId = req.userId!;
    const group = await ContactGroupModel.create({ userId, name });
    res.status(201).json({ group });
  } catch (error) {
    console.error('Error creating contact group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/contact-groups/:groupId/contacts/:contactId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId, contactId } = req.params;
    const userId = req.userId!;

    // Verify the contact belongs to the user
    const contact = await ContactModel.findById(contactId);
    if (!contact || contact.userId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify the group belongs to the user
    const group = await ContactGroupModel.findById(groupId);
    if (!group || group.userId !== userId) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const member = await ContactGroupModel.addContactToGroup(groupId, contactId);
    res.status(201).json({ member });
  } catch (error) {
    console.error('Error adding contact to group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/contact-groups/:groupId/contacts/:contactId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId, contactId } = req.params;
    const userId = req.userId!;

    // Verify the contact belongs to the user
    const contact = await ContactModel.findById(contactId);
    if (!contact || contact.userId !== userId) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify the group belongs to the user
    const group = await ContactGroupModel.findById(groupId);
    if (!group || group.userId !== userId) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const removed = await ContactGroupModel.removeContactFromGroup(groupId, contactId);
    if (!removed) {
      return res.status(404).json({ error: 'Contact not found in group' });
    }

    res.json({ message: 'Contact removed from group successfully' });
  } catch (error) {
    console.error('Error removing contact from group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Message History Routes
router.get('/messages', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const messages = await MessageModel.findByUserId(userId, limit, offset);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/messages/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const message = await MessageModel.findById(id);
    if (!message || message.userId !== userId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const recipients = await MessageRecipientModel.findByMessageId(id);

    res.json({
      message,
      recipients
    });
  } catch (error) {
    console.error('Error fetching message details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;