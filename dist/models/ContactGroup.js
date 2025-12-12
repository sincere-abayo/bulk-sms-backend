"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactGroupModel = void 0;
const uuid_1 = require("uuid");
class ContactGroupModel {
    static async create(groupData) {
        const group = {
            id: (0, uuid_1.v4)(),
            ...groupData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.groups.push(group);
        return group;
    }
    static async findByUserId(userId) {
        return this.groups.filter(group => group.userId === userId);
    }
    static async findById(id) {
        return this.groups.find(group => group.id === id) || null;
    }
    static async update(id, updates) {
        const index = this.groups.findIndex(group => group.id === id);
        if (index === -1)
            return null;
        this.groups[index] = {
            ...this.groups[index],
            ...updates,
            updatedAt: new Date(),
        };
        return this.groups[index];
    }
    static async delete(id) {
        const index = this.groups.findIndex(group => group.id === id);
        if (index === -1)
            return false;
        // Remove all group members
        this.groupMembers = this.groupMembers.filter(member => member.groupId !== id);
        this.groups.splice(index, 1);
        return true;
    }
    // Group member management
    static async addContactToGroup(groupId, contactId) {
        const member = {
            id: (0, uuid_1.v4)(),
            groupId,
            contactId,
        };
        this.groupMembers.push(member);
        return member;
    }
    static async removeContactFromGroup(groupId, contactId) {
        const index = this.groupMembers.findIndex(member => member.groupId === groupId && member.contactId === contactId);
        if (index === -1)
            return false;
        this.groupMembers.splice(index, 1);
        return true;
    }
    static async getGroupContacts(groupId) {
        return this.groupMembers
            .filter(member => member.groupId === groupId)
            .map(member => member.contactId);
    }
    static async getContactGroups(contactId) {
        return this.groupMembers
            .filter(member => member.contactId === contactId)
            .map(member => member.groupId);
    }
}
exports.ContactGroupModel = ContactGroupModel;
ContactGroupModel.groups = [];
ContactGroupModel.groupMembers = [];
