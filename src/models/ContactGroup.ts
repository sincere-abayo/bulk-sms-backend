import { v4 as uuidv4 } from 'uuid';

export interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactGroupMember {
  id: string;
  groupId: string;
  contactId: string;
}

export class ContactGroupModel {
  private static groups: ContactGroup[] = [];
  private static groupMembers: ContactGroupMember[] = [];

  static async create(groupData: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactGroup> {
    const group: ContactGroup = {
      id: uuidv4(),
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.groups.push(group);
    return group;
  }

  static async findByUserId(userId: string): Promise<ContactGroup[]> {
    return this.groups.filter(group => group.userId === userId);
  }

  static async findById(id: string): Promise<ContactGroup | null> {
    return this.groups.find(group => group.id === id) || null;
  }

  static async update(id: string, updates: Partial<Omit<ContactGroup, 'id' | 'createdAt'>>): Promise<ContactGroup | null> {
    const index = this.groups.findIndex(group => group.id === id);
    if (index === -1) return null;

    this.groups[index] = {
      ...this.groups[index],
      ...updates,
      updatedAt: new Date(),
    };

    return this.groups[index];
  }

  static async delete(id: string): Promise<boolean> {
    const index = this.groups.findIndex(group => group.id === id);
    if (index === -1) return false;

    // Remove all group members
    this.groupMembers = this.groupMembers.filter(member => member.groupId !== id);
    this.groups.splice(index, 1);
    return true;
  }

  // Group member management
  static async addContactToGroup(groupId: string, contactId: string): Promise<ContactGroupMember> {
    const member: ContactGroupMember = {
      id: uuidv4(),
      groupId,
      contactId,
    };

    this.groupMembers.push(member);
    return member;
  }

  static async removeContactFromGroup(groupId: string, contactId: string): Promise<boolean> {
    const index = this.groupMembers.findIndex(
      member => member.groupId === groupId && member.contactId === contactId
    );
    if (index === -1) return false;

    this.groupMembers.splice(index, 1);
    return true;
  }

  static async getGroupContacts(groupId: string): Promise<string[]> {
    return this.groupMembers
      .filter(member => member.groupId === groupId)
      .map(member => member.contactId);
  }

  static async getContactGroups(contactId: string): Promise<string[]> {
    return this.groupMembers
      .filter(member => member.contactId === contactId)
      .map(member => member.groupId);
  }
}