"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const connection_1 = require("../database/connection");
class UserModel {
    static async create(userData) {
        const { id, phone, name, email } = userData;
        const result = await (0, connection_1.query)('INSERT INTO users (id, phone, name, email) VALUES ($1, $2, $3, $4) RETURNING *', [id, phone, name, email]);
        return result.rows[0];
    }
    static async findByPhone(phone) {
        const result = await (0, connection_1.query)('SELECT * FROM users WHERE phone = $1', [phone]);
        return result.rows[0] || null;
    }
    static async findById(id) {
        const result = await (0, connection_1.query)('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async update(id, updates) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        if (fields.length === 0)
            return null;
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const result = await (0, connection_1.query)(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, ...values]);
        return result.rows[0] || null;
    }
    static async delete(id) {
        const result = await (0, connection_1.query)('DELETE FROM users WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
    static async findAll(limit = 100, offset = 0) {
        const result = await (0, connection_1.query)('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        return result.rows;
    }
}
exports.UserModel = UserModel;
