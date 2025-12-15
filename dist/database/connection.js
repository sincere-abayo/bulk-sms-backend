"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create pool configuration - prefer individual env vars to avoid URL encoding issues
const poolConfig = process.env.DB_HOST ? {
    // Use individual environment variables (safer for special characters in passwords)
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST?.includes('supabase.co') ? { rejectUnauthorized: false } : false
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
const pool = new pg_1.Pool(poolConfig);
const query = (text, params) => pool.query(text, params);
exports.query = query;
const getClient = () => pool.connect();
exports.getClient = getClient;
exports.default = pool;
