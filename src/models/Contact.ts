import { v4 as uuidv4 } from 'uuid';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  source: 'phonebook' | 'manual' | 'imported_file';
  hashPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ContactModel {
  private static contacts: Contact[] = [];

  static async create(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const contact: Contact = {
      id: uuidv4(),
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contacts.push(contact);
    return contact;
  }

  static async findByUserId(userId: string): Promise<Contact[]> {
    return this.contacts.filter(contact => contact.userId === userId);
  }

  static async findById(id: string): Promise<Contact | null> {
    return this.contacts.find(contact => contact.id === id) || null;
  }

  static async findByPhone(userId: string, phone: string): Promise<Contact | null> {
    return this.contacts.find(contact =>
      contact.userId === userId && contact.phone === phone
    ) || null;
  }

  static async update(id: string, updates: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<Contact | null> {
    const index = this.contacts.findIndex(contact => contact.id === id);
    if (index === -1) return null;

    this.contacts[index] = {
      ...this.contacts[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.contacts[index];
  }

  static async delete(id: string): Promise<boolean> {
    const index = this.contacts.findIndex(contact => contact.id === id);
    if (index === -1) return false;

    this.contacts.splice(index, 1);
    return true;
  }

  static async bulkCreate(userId: string, contacts: Array<{ name: string; phone: string; source?: string }>): Promise<Contact[]> {
    const newContacts: Contact[] = contacts.map(contactData => ({
      id: uuidv4(),
      userId,
      name: contactData.name,
      phone: contactData.phone,
      source: (contactData.source as Contact['source']) || 'manual',
      hashPhone: this.hashPhone(contactData.phone),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    this.contacts.push(...newContacts);
    return newContacts;
  }

  static hashPhone(phone: string): string {
    // Simple hash for demo - in production use proper hashing
    let hash = 0;
    for (let i = 0; i < phone.length; i++) {
      const char = phone.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}