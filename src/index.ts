import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import { createTables, runMigrations } from './database/migrations';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Bulk SMS App Backend API');
});

app.use('/api/auth', authRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    await createTables();
    await runMigrations();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
