import { query } from '../database/connection';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  static async create(userData: Omit<User, 'id'> & { id: string }): Promise<User> {
    const { id, phone, name, email } = userData;
    const result = await query(
      'INSERT INTO users (id, phone, name, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, phone, name, email]
    );
    return result.rows[0];
  }

  static async findByPhone(phone: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async findAll(limit = 100, offset = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
}