import { query } from '../config/database';

export interface Settings {
  registration_open: boolean;
}

const defaultSettings: Settings = {
  registration_open: true,
};

let cachedSettings: Settings | null = null;

export class SettingsModel {
  static async get(): Promise<Settings> {
    if (cachedSettings) {
      return cachedSettings;
    }

    try {
      const result = await query('SELECT settings FROM settings WHERE id = 1');
      if (result.rows.length > 0 && result.rows[0].settings) {
        cachedSettings = result.rows[0].settings as Settings;
      } else {
        cachedSettings = defaultSettings;
      }
    } catch (error) {
      console.log('Settings table not found, using defaults');
      cachedSettings = defaultSettings;
    }

    return cachedSettings!;
  }

  static async update(newSettings: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const updated = { ...current, ...newSettings };

    try {
      await query(
        `INSERT INTO settings (id, settings) VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET settings = $1`,
        [JSON.stringify(updated)]
      );
    } catch (error) {
      console.log('Could not update settings in database');
    }

    cachedSettings = updated;
    return updated;
  }

  static async isRegistrationOpen(): Promise<boolean> {
    const settings = await this.get();
    return settings.registration_open;
  }

  static async clearCache(): Promise<void> {
    cachedSettings = null;
  }
}