import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import { createTables, runMigrations } from './database/migrations';
import { testConnection } from './database/connection';
import { createSupabaseTables } from './database/supabase-migrations';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your environment configuration');
}

// Log environment info (without sensitive data)
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database URL configured:', !!process.env.DATABASE_URL);
console.log('JWT Secret configured:', !!process.env.JWT_SECRET);

const app = express();
const port = process.env.PORT || 4000;

// CORS configuration - Mobile-friendly setup
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000', // Admin dashboard development
  'https://your-admin-dashboard.vercel.app', // Admin dashboard production
];

// CORS configuration that works with mobile apps
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow specific web origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any localhost origin (development)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Expo development URLs (exp://, http://192.168.x.x)
    if (origin.startsWith('exp://') || origin.match(/^https?:\/\/192\.168\.\d+\.\d+/)) {
      return callback(null, true);
    }
    
    // Allow deployed admin dashboard
    if (origin.includes('vercel.app') || origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    // For production, you might want to be more restrictive
    // For now, allow all origins to ensure mobile apps work
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

console.log('CORS configured for mobile and web access');
app.use(express.json());

// Additional headers for mobile app compatibility
app.use((req, res, next) => {
  // Allow mobile apps to access the API
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.get('/', (req, res) => {
  res.send('Bulk SMS App Backend API');
});

app.use('/api/auth', authRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    
    // Test database connection first
    console.log('Testing database connection...');
    
    try {
      const connectionType = await testConnection();
      console.log(`Using ${connectionType} connection`);
      
      if (connectionType === 'postgresql') {
        // Use PostgreSQL migrations
        await createTables();
        console.log('Database tables created successfully');
        
        console.log('Running database migrations...');
        await runMigrations();
        console.log('Database migrations completed successfully');
      } else if (connectionType === 'supabase') {
        // Use Supabase REST API migrations
        console.log('Setting up database via Supabase REST API...');
        const supabaseSuccess = await createSupabaseTables();
        if (supabaseSuccess) {
          console.log('✅ Database setup completed via Supabase');
        } else {
          console.log('⚠️  Supabase setup had issues, but server will continue');
        }
      }
    } catch (error) {
      console.warn('⚠️  Database connection failed, starting server without database');
      console.warn('This is OK for testing API endpoints that don\'t require database');
      console.warn('Database error:', error instanceof Error ? error.message : String(error));
    }
    
    app.listen(port, () => {
      console.log(`✅ Server running successfully on port ${port}`);
      console.log(`🌐 API available at: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Provide helpful error messages
    if (error instanceof Error && 'code' in error && error.code === 'ENETUNREACH') {
      console.error('🔍 Database connection failed - check your DATABASE_URL');
      console.error('💡 Make sure your Supabase database is running and accessible');
    }
    
    process.exit(1);
  }
};

startServer();
