import { supabase } from './supabase-client';

// Verify and setup Supabase tables
export const createSupabaseTables = async () => {
  try {
    console.log('Verifying Supabase database setup...');

    // Test if we can access basic functionality
    const { error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      console.log('📋 Tables need to be created in Supabase dashboard');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/pjzwrisolsfdicxkipaa/editor');
      console.log('📝 Run the SQL commands from the setup guide');
      return false;
    }

    if (testError && testError.code === 'PGRST205') {
      console.log('📋 Tables need to be created in Supabase dashboard');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/pjzwrisolsfdicxkipaa/editor');
      return false;
    }

    // If no error or different error, tables might exist
    console.log('✅ Supabase database appears to be set up');
    
    // Try to ensure default data exists
    await createDefaultAdmin();
    await createDefaultAppSettings();

    return true;

  } catch (error) {
    console.error('❌ Error verifying Supabase setup:', error);
    console.log('📋 Manual table creation may be required');
    return false;
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if admin exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      // Create admin user
      const { error } = await supabase
        .from('users')
        .insert([
          {
            username: 'admin',
            email: 'admin@bulksms.com',
            password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
            role: 'admin'
          }
        ]);

      if (error) {
        console.log('Admin user will be created on first API call');
      } else {
        console.log('✅ Default admin user created');
      }
    }
  } catch (error) {
    console.log('Admin user setup will be handled by API');
  }
};

// Create default app settings
const createDefaultAppSettings = async () => {
  try {
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('app_settings')
      .select('id')
      .single();

    if (!existingSettings) {
      // Create default settings
      const { error } = await supabase
        .from('app_settings')
        .insert([
          {
            android_app_url: process.env.ANDROID_APP_URL || 'https://play.google.com/store/apps/details?id=com.bulksmspro.app',
            ios_app_url: process.env.IOS_APP_URL || 'https://apps.apple.com/app/bulksmspro/id123456789',
            enable_android: true,
            enable_ios: true
          }
        ]);

      if (error) {
        console.log('App settings will be created on first API call');
      } else {
        console.log('✅ Default app settings created');
      }
    }
  } catch (error) {
    console.log('App settings setup will be handled by API');
  }
};