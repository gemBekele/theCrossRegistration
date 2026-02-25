import { query } from '../config/database';
import { RegistrationSession } from '../types';

export class SessionModel {
  static async findByTelegramId(telegramId: string): Promise<RegistrationSession | null> {
    const result = await query('SELECT * FROM sessions WHERE telegram_id = $1', [telegramId]);
    return result.rows[0] || null;
  }

  static async createOrUpdate(
    telegramId: string,
    step: string,
    data: Record<string, any>,
    language: 'en' | 'am' = 'en'
  ): Promise<RegistrationSession> {
    const result = await query(
      `INSERT INTO sessions (telegram_id, current_step, data, language)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (telegram_id)
       DO UPDATE SET current_step = $2, data = $3, language = $4
       RETURNING *`,
      [telegramId, step, JSON.stringify(data), language]
    );
    return result.rows[0];
  }

  static async updateData(telegramId: string, data: Record<string, any>): Promise<void> {
    await query(
      'UPDATE sessions SET data = data || $1::jsonb WHERE telegram_id = $2',
      [JSON.stringify(data), telegramId]
    );
  }

  static async updateStep(telegramId: string, step: string): Promise<void> {
    await query('UPDATE sessions SET current_step = $1 WHERE telegram_id = $2', [step, telegramId]);
  }

  static async delete(telegramId: string): Promise<void> {
    await query('DELETE FROM sessions WHERE telegram_id = $1', [telegramId]);
  }
}