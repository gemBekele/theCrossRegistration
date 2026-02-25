import { query, transaction } from '../config/database';
import { User } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [identifier]
    );
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(): Promise<User[]> {
    const result = await query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  static async create(email: string, password: string, role: 'super_admin' | 'reviewer' = 'reviewer'): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    // Use part before @ as username
    const username = email.split('@')[0];
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, passwordHash, role]
    );
    return result.rows[0];
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  }

  static async delete(id: number): Promise<void> {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}