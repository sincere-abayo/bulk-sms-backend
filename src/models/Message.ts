import { query } from '../database/connection';

export interface Message {
  id: string;
  userId: string;
  content: string;
  smsCount: number;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'pending' | 'sending' | 'completed' | 'failed' | 'partial';
  cost: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecipient {
  id: string;
  messageId: string;
  contactId?: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export class MessageModel {
  static async create(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const id = Date.now().toString();
    const now = new Date();

    await query(`
      INSERT INTO messages (
        id, user_id, content, sms_count, total_recipients,
        sent_count, failed_count, status, cost, payment_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      id,
      messageData.userId,
      messageData.content,
      messageData.smsCount,
      messageData.totalRecipients,
      messageData.sentCount,
      messageData.failedCount,
      messageData.status,
      messageData.cost,
      messageData.paymentId,
      now,
      now
    ]);

    return {
      id,
      ...messageData,
      createdAt: now,
      updatedAt: now
    };
  }

  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const result = await query(`
      SELECT * FROM messages
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      smsCount: row.sms_count,
      totalRecipients: row.total_recipients,
      sentCount: row.sent_count,
      failedCount: row.failed_count,
      status: row.status,
      cost: parseFloat(row.cost),
      paymentId: row.payment_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  static async findById(id: string): Promise<Message | null> {
    const result = await query('SELECT * FROM messages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      smsCount: row.sms_count,
      totalRecipients: row.total_recipients,
      sentCount: row.sent_count,
      failedCount: row.failed_count,
      status: row.status,
      cost: parseFloat(row.cost),
      paymentId: row.payment_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async updateStatus(id: string, status: Message['status'], sentCount?: number, failedCount?: number): Promise<void> {
    const updates: any[] = [status];
    let queryStr = 'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP';

    if (sentCount !== undefined) {
      queryStr += ', sent_count = $2';
      updates.push(sentCount);
    }

    if (failedCount !== undefined) {
      queryStr += sentCount !== undefined ? ', failed_count = $3' : ', failed_count = $2';
      updates.push(failedCount);
    }

    queryStr += ' WHERE id = $' + (updates.length + 1);
    updates.push(id);

    await query(queryStr, updates);
  }
}

export class MessageRecipientModel {
  static async createBulk(recipients: Omit<MessageRecipient, 'id' | 'createdAt'>[]): Promise<MessageRecipient[]> {
    const now = new Date();
    const createdRecipients: MessageRecipient[] = [];

    for (const recipient of recipients) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await query(`
        INSERT INTO message_recipients (
          id, message_id, contact_id, name, phone, status, error_message, sent_at, delivered_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        id,
        recipient.messageId,
        recipient.contactId,
        recipient.name,
        recipient.phone,
        recipient.status,
        recipient.errorMessage,
        recipient.sentAt,
        recipient.deliveredAt,
        now
      ]);

      createdRecipients.push({
        id,
        ...recipient,
        createdAt: now
      });
    }

    return createdRecipients;
  }

  static async updateStatus(id: string, status: MessageRecipient['status'], errorMessage?: string, sentAt?: Date, deliveredAt?: Date): Promise<void> {
    const updates: any[] = [status];
    let queryStr = 'UPDATE message_recipients SET status = $1';

    if (errorMessage !== undefined) {
      queryStr += ', error_message = $2';
      updates.push(errorMessage);
    }

    if (sentAt !== undefined) {
      queryStr += ', sent_at = $' + (updates.length + 1);
      updates.push(sentAt);
    }

    if (deliveredAt !== undefined) {
      queryStr += ', delivered_at = $' + (updates.length + 1);
      updates.push(deliveredAt);
    }

    queryStr += ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + (updates.length + 1);
    updates.push(id);

    await query(queryStr, updates);
  }

  static async findByMessageId(messageId: string): Promise<MessageRecipient[]> {
    const result = await query('SELECT * FROM message_recipients WHERE message_id = $1 ORDER BY created_at', [messageId]);

    return result.rows.map(row => ({
      id: row.id,
      messageId: row.message_id,
      contactId: row.contact_id,
      name: row.name,
      phone: row.phone,
      status: row.status,
      errorMessage: row.error_message,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      createdAt: new Date(row.created_at)
    }));
  }
}