"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropTables = exports.runMigrations = exports.createTables = void 0;
const connection_1 = require("./connection");
const createTables = async () => {
    try {
        // Create users table
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create contacts table
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create messages table
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sms_count INTEGER DEFAULT 1,
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        cost DECIMAL(10,2),
        payment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create message_recipients table for detailed tracking
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS message_recipients (
        id VARCHAR(255) PRIMARY KEY,
        message_id VARCHAR(255) REFERENCES messages(id) ON DELETE CASCADE,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE SET NULL,
        name VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create payments table
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Database tables created successfully');
    }
    catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
};
exports.createTables = createTables;
const runMigrations = async () => {
    try {
        console.log('Running database migrations...');
        // Add new columns to existing messages table
        try {
            await (0, connection_1.query)(`
        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS sms_count INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)
      `);
            // Drop the old recipients column if it exists
            try {
                await (0, connection_1.query)(`ALTER TABLE messages DROP COLUMN IF EXISTS recipients`);
                console.log('Dropped old recipients column');
            }
            catch (dropError) {
                console.log('Old recipients column may not exist or already dropped');
            }
            console.log('Messages table migrated successfully');
        }
        catch (error) {
            console.log('Messages table already migrated or migration failed:', error);
        }
        // Create message_recipients table if it doesn't exist
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS message_recipients (
        id VARCHAR(255) PRIMARY KEY,
        message_id VARCHAR(255) REFERENCES messages(id) ON DELETE CASCADE,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE SET NULL,
        name VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add updated_at column if it doesn't exist
        try {
            await (0, connection_1.query)(`ALTER TABLE message_recipients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            console.log('Added updated_at column to message_recipients');
        }
        catch (error) {
            console.log('updated_at column may already exist');
        }
        console.log('Message recipients table created');
        // Create app_settings table
        await (0, connection_1.query)(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        android_url VARCHAR(500) NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.bulksmspro.app',
        ios_url VARCHAR(500) NOT NULL DEFAULT 'https://apps.apple.com/app/bulksmspro/id123456789',
        enable_android BOOLEAN NOT NULL DEFAULT true,
        enable_ios BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('App settings table created');
        console.log('Database migrations completed successfully');
    }
    catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
const dropTables = async () => {
    try {
        await (0, connection_1.query)('DROP TABLE IF EXISTS app_settings CASCADE');
        await (0, connection_1.query)('DROP TABLE IF EXISTS message_recipients CASCADE');
        await (0, connection_1.query)('DROP TABLE IF EXISTS payments CASCADE');
        await (0, connection_1.query)('DROP TABLE IF EXISTS messages CASCADE');
        await (0, connection_1.query)('DROP TABLE IF EXISTS contacts CASCADE');
        await (0, connection_1.query)('DROP TABLE IF EXISTS users CASCADE');
        console.log('Database tables dropped successfully');
    }
    catch (error) {
        console.error('Error dropping tables:', error);
        throw error;
    }
};
exports.dropTables = dropTables;
