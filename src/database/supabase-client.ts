import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

// Supabase configuration - Updated for new project
const supabaseUrl = process.env.SUPABASE_URL || 'https://pjzwrisolsfdicxkipaa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'temp-key-needs-update';

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key configured:', !!supabaseServiceKey && supabaseServiceKey !== 'temp-key-needs-update');
console.log('Service Key length:', supabaseServiceKey.length);
console.log('Service Key preview:', supabaseServiceKey.substring(0, 50) + '...');

// Create Supabase client with service role key (for backend operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    // Try to access any table - if we get a table not found error, that's actually good (means connection works)
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    // These error codes mean the connection is working but table doesn't exist (which is fine)
    if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
      console.log('✅ Supabase connection successful (table not found is expected for new project)');
      return true;
    }
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};