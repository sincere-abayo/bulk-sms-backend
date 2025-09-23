# Bulk SMS App Backend

This is the backend API for the Bulk SMS App. It will be built with Node.js/Express and PostgreSQL.

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables:
- `JWT_SECRET`: Change to a secure random string
- `DB_*`: Database configuration
- `AFRICASTALKING_USERNAME`: Your Africa's Talking username
- `AFRICASTALKING_API_KEY`: Your Africa's Talking API key

### 2. Africa's Talking SMS Setup
1. Sign up at [Africa's Talking](https://africastalking.com/)
2. Get your API key from the dashboard
3. Add credits to your account for SMS sending
4. Update the environment variables

### 3. Database Setup
Ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE bulk_sms_app;
```

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login

## SMS Integration

The app uses Africa's Talking for SMS delivery. OTP codes are sent via SMS to user phones. In development, OTPs are also logged to console for testing.
