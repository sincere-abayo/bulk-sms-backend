"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const migrations_1 = require("./database/migrations");
const connection_1 = require("./database/connection");
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// CORS configuration with environment variables
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.MOBILE_APP_URL || 'http://localhost:8081',
    'http://localhost:3000', // Always allow localhost for development
    'http://localhost:8081'
].filter(Boolean);
console.log('CORS allowed origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.send('Bulk SMS App Backend API');
});
app.use('/api/auth', auth_1.default);
// Initialize database and start server
const startServer = async () => {
    try {
        console.log('Starting server initialization...');
        // Test database connection first
        console.log('Testing database connection...');
        try {
            const connectionType = await (0, connection_1.testConnection)();
            console.log(`Using ${connectionType} connection`);
            await (0, migrations_1.createTables)();
            console.log('Database tables created successfully');
            console.log('Running database migrations...');
            await (0, migrations_1.runMigrations)();
            console.log('Database migrations completed successfully');
        }
        catch (error) {
            console.warn('⚠️  Database connection failed, starting server without database');
            console.warn('This is OK for testing API endpoints that don\'t require database');
            console.warn('Database error:', error instanceof Error ? error.message : String(error));
        }
        app.listen(port, () => {
            console.log(`✅ Server running successfully on port ${port}`);
            console.log(`🌐 API available at: http://localhost:${port}`);
        });
    }
    catch (error) {
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
