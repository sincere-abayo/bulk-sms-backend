"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSupabaseConnection = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure dotenv is loaded
dotenv_1.default.config();
// Supabase configuration - Updated for new project
const supabaseUrl = process.env.SUPABASE_URL || 'https://pjzwrisolsfdicxkipaa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'temp-key-needs-update';
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key configured:', !!supabaseServiceKey && supabaseServiceKey !== 'temp-key-needs-update');
console.log('Service Key length:', supabaseServiceKey.length);
console.log('Service Key preview:', supabaseServiceKey.substring(0, 50) + '...');
// Create Supabase client with service role key (for backend operations)
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// Test connection function
const testSupabaseConnection = async () => {
    try {
        // Try to access any table - if we get a table not found error, that's actually good (means connection works)
        const { data, error } = await exports.supabase.from('users').select('count').limit(1);
        // These error codes mean the connection is working but table doesn't exist (which is fine)
        if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
            console.log('✅ Supabase connection successful (table not found is expected for new project)');
            return true;
        }
        if (error) {
            throw error;
        }
        return true;
    }
    catch (error) {
        console.error('Supabase connection test failed:', error);
        return false;
    }
};
exports.testSupabaseConnection = testSupabaseConnection;
