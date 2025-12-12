import { query } from '../database/connection';

export interface AppSettings {
  id: number;
  android_url: string;
  ios_url: string;
  enable_android: boolean;
  enable_ios: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AppSettingsModel {
  static async getSettings(): Promise<AppSettings | null> {
    try {
      const result = await query('SELECT * FROM app_settings ORDER BY id DESC LIMIT 1');
      
      if (result.rows.length === 0) {
        // Return default settings if none exist
        return {
          id: 0,
          android_url: 'https://play.google.com/store/apps/details?id=com.bulksmspro.app',
          ios_url: 'https://apps.apple.com/app/bulksmspro/id123456789',
          enable_android: true,
          enable_ios: true,
          created_at: new Date(),
          updated_at: new Date()
        };
      }

      const row = result.rows[0];
      return {
        id: row.id,
        android_url: row.android_url,
        ios_url: row.ios_url,
        enable_android: row.enable_android,
        enable_ios: row.enable_ios,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error fetching app settings:', error);
      return null;
    }
  }

  static async updateSettings(settings: {
    android_url: string;
    ios_url: string;
    enable_android: boolean;
    enable_ios: boolean;
  }): Promise<AppSettings | null> {
    try {
      // Check if settings exist
      const existingSettings = await query('SELECT id FROM app_settings ORDER BY id DESC LIMIT 1');
      
      if (existingSettings.rows.length === 0) {
        // Create new settings
        const result = await query(`
          INSERT INTO app_settings (android_url, ios_url, enable_android, enable_ios, created_at, updated_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [settings.android_url, settings.ios_url, settings.enable_android, settings.enable_ios]);

        const row = result.rows[0];
        return {
          id: row.id,
          android_url: row.android_url,
          ios_url: row.ios_url,
          enable_android: row.enable_android,
          enable_ios: row.enable_ios,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at)
        };
      } else {
        // Update existing settings
        const result = await query(`
          UPDATE app_settings 
          SET android_url = $1, ios_url = $2, enable_android = $3, enable_ios = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
        `, [settings.android_url, settings.ios_url, settings.enable_android, settings.enable_ios, existingSettings.rows[0].id]);

        const row = result.rows[0];
        return {
          id: row.id,
          android_url: row.android_url,
          ios_url: row.ios_url,
          enable_android: row.enable_android,
          enable_ios: row.enable_ios,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at)
        };
      }
    } catch (error) {
      console.error('Error updating app settings:', error);
      return null;
    }
  }

  static async createTable(): Promise<void> {
    try {
      await query(`
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
      console.log('App settings table created successfully');
    } catch (error) {
      console.error('Error creating app settings table:', error);
    }
  }
}