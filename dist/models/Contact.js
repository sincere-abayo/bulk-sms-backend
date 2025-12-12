"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactModel = void 0;
const uuid_1 = require("uuid");
class ContactModel {
    static async create(contactData) {
        const contact = {
            id: (0, uuid_1.v4)(),
            ...contactData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.contacts.push(contact);
        return contact;
    }
    static async findByUserId(userId) {
        return this.contacts.filter(contact => contact.userId === userId);
    }
    static async findById(id) {
        return this.contacts.find(contact => contact.id === id) || null;
    }
    static async findByPhone(userId, phone) {
        return this.contacts.find(contact => contact.userId === userId && contact.phone === phone) || null;
    }
    static async update(id, updates) {
        const index = this.contacts.findIndex(contact => contact.id === id);
        if (index === -1)
            return null;
        this.contacts[index] = {
            ...this.contacts[index],
            ...updates,
            updatedAt: new Date(),
        };
        return this.contacts[index];
    }
    static async delete(id) {
        const index = this.contacts.findIndex(contact => contact.id === id);
        if (index === -1)
            return false;
        this.contacts.splice(index, 1);
        return true;
    }
    static async bulkCreate(userId, contacts) {
        const newContacts = contacts.map(contactData => ({
            id: (0, uuid_1.v4)(),
            userId,
            name: contactData.name,
            phone: contactData.phone,
            source: contactData.source || 'manual',
            hashPhone: this.hashPhone(contactData.phone),
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        this.contacts.push(...newContacts);
        return newContacts;
    }
    static hashPhone(phone) {
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
exports.ContactModel = ContactModel;
ContactModel.contacts = [];
