"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = exports.testConnection = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_client_1 = require("./supabase-client");
dotenv_1.default.config();
// Create pool configuration - prefer individual env vars to avoid URL encoding issues
const poolConfig = process.env.DB_HOST ? {
    // Use individual environment variables (safer for special characters in passwords)
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
    // Connection options to handle IPv6 issues
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000,
    // Additional options for better connectivity
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
} : process.env.DATABASE_URL ? {
    // Fallback to connection string if individual vars not available
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
} : {
    // Local development defaults
    user: 'postgres',
    host: 'localhost',
    database: 'bulk_sms_app',
    password: 'password',
    port: 5432,
};
console.log('Database connection config:', {
    host: poolConfig.host || 'localhost',
    database: poolConfig.database || 'bulk_sms_app',
    user: poolConfig.user || 'postgres',
    port: poolConfig.port || 5432,
    ssl: !!poolConfig.ssl,
    hasPassword: !!poolConfig.password
});
const pool = new pg_1.Pool(poolConfig);
// Test connection and provide fallback
const testConnection = async () => {
    try {
        // Try PostgreSQL connection first
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connection successful');
        return 'postgresql';
    }
    catch (error) {
        console.log('❌ PostgreSQL connection failed, testing Supabase REST API...');
        // Fallback to Supabase REST API
        const supabaseWorks = await (0, supabase_client_1.testSupabaseConnection)();
        if (supabaseWorks) {
            console.log('✅ Supabase REST API connection successful');
            return 'supabase';
        }
        else {
            console.log('❌ Both PostgreSQL and Supabase connections failed');
            throw new Error('No database connection available');
        }
    }
};
exports.testConnection = testConnection;
const query = (text, params) => pool.query(text, params);
exports.query = query;
const getClient = () => pool.connect();
exports.getClient = getClient;
exports.default = pool;
