import { Pool } from 'pg';
import dotenv from 'dotenv';
import { testSupabaseConnection } from './supabase-client';

dotenv.config();

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

const pool = new Pool(poolConfig);

// Test connection and provide fallback
export const testConnection = async () => {
  try {
    // Try PostgreSQL connection first
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection successful');
    return 'postgresql';
  } catch (error) {
    console.log('❌ PostgreSQL connection failed, testing Supabase REST API...');
    
    // Fallback to Supabase REST API
    const supabaseWorks = await testSupabaseConnection();
    if (supabaseWorks) {
      console.log('✅ Supabase REST API connection successful');
      return 'supabase';
    } else {
      console.log('❌ Both PostgreSQL and Supabase connections failed');
      throw new Error('No database connection available');
    }
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;