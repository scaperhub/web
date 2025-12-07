import fs from 'fs';
import path from 'path';
import { User, Category, Item, Message, Conversation, OTP } from './types';

// Check if we should use Supabase
const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || 
                     (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// If using Supabase, export the Supabase database module
if (USE_SUPABASE) {
  // Use Supabase database
  const supabaseDb = require('./db-supabase');
  module.exports = { db: supabaseDb.db };
} else {
  // Use JSON file-based database
  const dataDir = path.join(process.cwd(), 'data');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const getFilePath = (filename: string) => path.join(dataDir, filename);

  const readFile = <T>(filename: string): T[] => {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const writeFile = <T>(filename: string, data: T[]): void => {
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  // Database operations
  const db = {
    users: {
      getAll: async (): Promise<User[]> => readFile<User>('users.json'),
      getByEmail: async (email: string): Promise<User | undefined> => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.email === email);
        // Migrate old users to have new fields
        if (user) {
          const userWithDefaults = user as any;
          if (!('status' in userWithDefaults)) {
            userWithDefaults.status = 'approved'; // Auto-approve existing users
            userWithDefaults.emailVerified = true; // Assume existing users are verified
            await db.users.update(user.id, { status: 'approved', emailVerified: true });
          }
          // Migrate username if missing
          if (!('username' in userWithDefaults) || !userWithDefaults.username) {
            // Generate username from email or name
            const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let generatedUsername = baseUsername;
            let counter = 1;
            // Ensure uniqueness
            while (users.some(u => u.username === generatedUsername)) {
              generatedUsername = `${baseUsername}${counter}`;
              counter++;
            }
            await db.users.update(user.id, { username: generatedUsername });
            userWithDefaults.username = generatedUsername;
          }
          // Migrate verified field if missing
          if (!('verified' in userWithDefaults)) {
            await db.users.update(user.id, { verified: false });
            userWithDefaults.verified = false;
          }
          // Migrate userType field if missing
          if (!('userType' in userWithDefaults)) {
            await db.users.update(user.id, { userType: 'hobbyist' });
            userWithDefaults.userType = 'hobbyist';
          }
          // Migrate following field if missing
          if (!('following' in userWithDefaults)) {
            await db.users.update(user.id, { following: [] });
            userWithDefaults.following = [];
          }
        }
        return user;
      },
      getById: async (id: string): Promise<User | undefined> => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.id === id);
        // Migrate old users to have new fields
        if (user) {
          const userWithDefaults = user as any;
          if (!('status' in userWithDefaults)) {
            userWithDefaults.status = 'approved'; // Auto-approve existing users
            userWithDefaults.emailVerified = true; // Assume existing users are verified
            await db.users.update(user.id, { status: 'approved', emailVerified: true });
          }
          // Migrate username if missing
          if (!('username' in userWithDefaults) || !userWithDefaults.username) {
            // Generate username from email or name
            const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let generatedUsername = baseUsername;
            let counter = 1;
            // Ensure uniqueness
            while (users.some(u => u.username === generatedUsername)) {
              generatedUsername = `${baseUsername}${counter}`;
              counter++;
            }
            await db.users.update(user.id, { username: generatedUsername });
            userWithDefaults.username = generatedUsername;
          }
          // Migrate verified field if missing
          if (!('verified' in userWithDefaults)) {
            await db.users.update(user.id, { verified: false });
            userWithDefaults.verified = false;
          }
          // Migrate userType field if missing
          if (!('userType' in userWithDefaults)) {
            await db.users.update(user.id, { userType: 'hobbyist' });
            userWithDefaults.userType = 'hobbyist';
          }
          // Migrate following field if missing
          if (!('following' in userWithDefaults)) {
            await db.users.update(user.id, { following: [] });
            userWithDefaults.following = [];
          }
        }
        return user;
      },
      getByUsername: async (username: string): Promise<User | undefined> => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.username === username);
        // Migrate old users to have new fields
        if (user) {
          const userWithDefaults = user as any;
          if (!('status' in userWithDefaults)) {
            userWithDefaults.status = 'approved'; // Auto-approve existing users
            userWithDefaults.emailVerified = true; // Assume existing users are verified
            await db.users.update(user.id, { status: 'approved', emailVerified: true });
          }
          // Migrate verified field if missing
          if (!('verified' in userWithDefaults)) {
            await db.users.update(user.id, { verified: false });
            userWithDefaults.verified = false;
          }
          // Migrate userType field if missing
          if (!('userType' in userWithDefaults)) {
            await db.users.update(user.id, { userType: 'hobbyist' });
            userWithDefaults.userType = 'hobbyist';
          }
          // Migrate following field if missing
          if (!('following' in userWithDefaults)) {
            await db.users.update(user.id, { following: [] });
            userWithDefaults.following = [];
          }
        }
        return user;
      },
      create: async (user: User): Promise<User> => {
        const users = readFile<User>('users.json');
        users.push(user);
        writeFile('users.json', users);
        return user;
      },
      update: async (id: string, updates: Partial<User>): Promise<User | null> => {
        const users = readFile<User>('users.json');
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates };
        writeFile('users.json', users);
        return users[index];
      },
    },
    categories: {
      getAll: async (): Promise<Category[]> => readFile<Category>('categories.json'),
      getById: async (id: string): Promise<Category | undefined> => {
        const categories = readFile<Category>('categories.json');
        return categories.find(c => c.id === id);
      },
      create: async (category: Category): Promise<Category> => {
        const categories = readFile<Category>('categories.json');
        categories.push(category);
        writeFile('categories.json', categories);
        return category;
      },
      update: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
        const categories = readFile<Category>('categories.json');
        const index = categories.findIndex(c => c.id === id);
        if (index === -1) return null;
        categories[index] = { ...categories[index], ...updates };
        writeFile('categories.json', categories);
        return categories[index];
      },
      delete: (id: string): boolean => {
        const categories = readFile<Category>('categories.json');
        const filtered = categories.filter(c => c.id !== id);
        if (filtered.length === categories.length) return false;
        writeFile('categories.json', filtered);
        return true;
      },
    },
    items: {
      getAll: async (): Promise<Item[]> => {
        const items = readFile<Item>('items.json');
        // Migration: Add approvalStatus and quantity to existing items if missing
        let needsMigration = false;
        const migrated: Item[] = items.map((item: any) => {
          let updated = false;
          if (!('approvalStatus' in item)) {
            item.approvalStatus = 'approved';
            updated = true;
          }
          if (!('quantity' in item)) {
            item.quantity = 1;
            updated = true;
          }
          if (updated) {
            needsMigration = true;
          }
          return item as Item;
        });
        if (needsMigration) {
          writeFile('items.json', migrated);
        }
        return migrated;
      },
      getById: async (id: string): Promise<Item | undefined> => {
        const items = readFile<Item>('items.json');
        return items.find(i => i.id === id);
      },
      getBySeller: async (sellerId: string): Promise<Item[]> => {
        const items = readFile<Item>('items.json');
        return items.filter(i => i.sellerId === sellerId);
      },
      getByCategory: async (categoryId: string): Promise<Item[]> => {
        const items = readFile<Item>('items.json');
        return items.filter(i => i.categoryId === categoryId);
      },
      create: async (item: Item): Promise<Item> => {
        const items = readFile<Item>('items.json');
        items.push(item);
        writeFile('items.json', items);
        return item;
      },
      update: async (id: string, updates: Partial<Item>): Promise<Item | null> => {
        const items = readFile<Item>('items.json');
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates };
        writeFile('items.json', items);
        return items[index];
      },
      delete: (id: string): boolean => {
        const items = readFile<Item>('items.json');
        const filtered = items.filter(i => i.id !== id);
        if (filtered.length === items.length) return false;
        writeFile('items.json', filtered);
        return true;
      },
    },
    messages: {
      getAll: async (): Promise<Message[]> => readFile<Message>('messages.json'),
      getByConversation: async (conversationId: string): Promise<Message[]> => {
        const messages = readFile<Message>('messages.json');
        return messages.filter(m => m.conversationId === conversationId).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      },
      create: async (message: Message): Promise<Message> => {
        const messages = readFile<Message>('messages.json');
        messages.push(message);
        writeFile('messages.json', messages);
        return message;
      },
      markAsRead: async (conversationId: string, userId: string): Promise<void> => {
        const messages = readFile<Message>('messages.json');
        const updated = messages.map(m => 
          m.conversationId === conversationId && m.receiverId === userId && !m.read
            ? { ...m, read: true }
            : m
        );
        writeFile('messages.json', updated);
      },
    },
    conversations: {
      getAll: async (): Promise<Conversation[]> => readFile<Conversation>('conversations.json'),
      getByUser: async (userId: string): Promise<Conversation[]> => {
        const conversations = readFile<Conversation>('conversations.json');
        return conversations.filter(c => c.buyerId === userId || c.sellerId === userId);
      },
      getById: async (id: string): Promise<Conversation | undefined> => {
        const conversations = readFile<Conversation>('conversations.json');
        return conversations.find(c => c.id === id);
      },
      getByItemAndBuyer: async (itemId: string, buyerId: string): Promise<Conversation | undefined> => {
        const conversations = readFile<Conversation>('conversations.json');
        return conversations.find(c => c.itemId === itemId && c.buyerId === buyerId);
      },
      create: async (conversation: Conversation): Promise<Conversation> => {
        const conversations = readFile<Conversation>('conversations.json');
        conversations.push(conversation);
        writeFile('conversations.json', conversations);
        return conversation;
      },
      update: async (id: string, updates: Partial<Conversation>): Promise<Conversation | null> => {
        const conversations = readFile<Conversation>('conversations.json');
        const index = conversations.findIndex(c => c.id === id);
        if (index === -1) return null;
        conversations[index] = { ...conversations[index], ...updates };
        writeFile('conversations.json', conversations);
        return conversations[index];
      },
    },
    otps: {
      getAll: async (): Promise<OTP[]> => readFile<OTP>('otps.json'),
      getByEmail: async (email: string): Promise<OTP | undefined> => {
        const otps = readFile<OTP>('otps.json');
        // Get the most recent OTP for this email
        const userOtps = otps.filter(o => o.email === email);
        if (userOtps.length === 0) return undefined;
        return userOtps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      },
      create: async (otp: OTP): Promise<OTP> => {
        const otps = readFile<OTP>('otps.json');
        // Remove old OTPs for this email
        const filtered = otps.filter(o => o.email !== otp.email);
        filtered.push(otp);
        writeFile('otps.json', filtered);
        return otp;
      },
      delete: async (email: string): Promise<void> => {
        const otps = readFile<OTP>('otps.json');
        const filtered = otps.filter(o => o.email !== email);
        writeFile('otps.json', filtered);
      },
      cleanup: async (): Promise<void> => {
        const otps = readFile<OTP>('otps.json');
        const now = new Date();
        const valid = otps.filter(o => new Date(o.expiresAt) > now);
        writeFile('otps.json', valid);
      },
    },
  };

  // Export for JSON-based database
  module.exports = { db };
}
