import fs from 'fs';
import path from 'path';
import { User, Category, Item, Message, Conversation, OTP } from './types';
import { db as supabaseDb } from './db-supabase';

const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || 
                     (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function createDb() {
  if (USE_SUPABASE) {
    return supabaseDb;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const getFilePath = (filename: string) => path.join(dataDir, filename);
  const readFile = <T>(filename: string): T[] => {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  };
  const writeFile = <T>(filename: string, data: T[]): void => {
    fs.writeFileSync(getFilePath(filename), JSON.stringify(data, null, 2));
  };
  const updateUserDirect = (id: string, updates: Partial<User>): void => {
    const users = readFile<User>('users.json');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      writeFile('users.json', users);
    }
  };

  return {
    users: {
      getAll: async () => readFile<User>('users.json'),
      getByEmail: async (email: string) => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.email === email);
        if (user) {
          const u = user as any;
          if (!('status' in u)) updateUserDirect(user.id, { status: 'approved', emailVerified: true });
          if (!('username' in u) || !u.username) {
            const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = base;
            let i = 1;
            while (users.some(u => u.username === username)) username = `${base}${i++}`;
            updateUserDirect(user.id, { username });
            u.username = username;
          }
          if (!('verified' in u)) updateUserDirect(user.id, { verified: false });
          if (!('userType' in u)) updateUserDirect(user.id, { userType: 'hobbyist' });
          if (!('following' in u)) updateUserDirect(user.id, { following: [] });
        }
        return user;
      },
      getById: async (id: string) => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.id === id);
        if (user) {
          const u = user as any;
          if (!('status' in u)) updateUserDirect(user.id, { status: 'approved', emailVerified: true });
          if (!('username' in u) || !u.username) {
            const base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = base;
            let i = 1;
            while (users.some(u => u.username === username)) username = `${base}${i++}`;
            updateUserDirect(user.id, { username });
            u.username = username;
          }
          if (!('verified' in u)) updateUserDirect(user.id, { verified: false });
          if (!('userType' in u)) updateUserDirect(user.id, { userType: 'hobbyist' });
          if (!('following' in u)) updateUserDirect(user.id, { following: [] });
        }
        return user;
      },
      getByUsername: async (username: string) => {
        const users = readFile<User>('users.json');
        const user = users.find(u => u.username === username);
        if (user) {
          const u = user as any;
          if (!('status' in u)) updateUserDirect(user.id, { status: 'approved', emailVerified: true });
          if (!('verified' in u)) updateUserDirect(user.id, { verified: false });
          if (!('userType' in u)) updateUserDirect(user.id, { userType: 'hobbyist' });
          if (!('following' in u)) updateUserDirect(user.id, { following: [] });
        }
        return user;
      },
      create: async (user: User) => {
        const users = readFile<User>('users.json');
        users.push(user);
        writeFile('users.json', users);
        return user;
      },
      update: async (id: string, updates: Partial<User>) => {
        const users = readFile<User>('users.json');
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates };
        writeFile('users.json', users);
        return users[index];
      },
    categories: {
      getAll: async () => readFile<Category>('categories.json'),
      getById: async (id: string) => readFile<Category>('categories.json').find(c => c.id === id),
      create: async (category: Category) => {
        const categories = readFile<Category>('categories.json');
        categories.push(category);
        writeFile('categories.json', categories);
        return category;
      },
      update: async (id: string, updates: Partial<Category>) => {
        const categories = readFile<Category>('categories.json');
        const index = categories.findIndex(c => c.id === id);
        if (index === -1) return null;
        categories[index] = { ...categories[index], ...updates };
        writeFile('categories.json', categories);
        return categories[index];
      },
      delete: async (id: string) => {
        const categories = readFile<Category>('categories.json');
        const filtered = categories.filter(c => c.id !== id);
        if (filtered.length === categories.length) return false;
        writeFile('categories.json', filtered);
        return true;
      },
    },
    items: {
      getAll: async () => {
        const items = readFile<Item>('items.json');
        const migrated = items.map((item: any) => {
          if (!('approvalStatus' in item)) item.approvalStatus = 'approved';
        });
      },
      getById: async (id: string) => readFile<Item>('items.json').find(i => i.id === id),
      getBySeller: async (sellerId: string) => readFile<Item>('items.json').filter(i => i.sellerId === sellerId),
      getByCategory: async (categoryId: string) => readFile<Item>('items.json').filter(i => i.categoryId === categoryId),
      create: async (item: Item) => {
        const items = readFile<Item>('items.json');
        items.push(item);
        writeFile('items.json', items);
        return item;
      },
      update: async (id: string, updates: Partial<Item>) => {
        const items = readFile<Item>('items.json');
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates };
        writeFile('items.json', items);
        return items[index];
      },
      delete: async (id: string) => {
        const items = readFile<Item>('items.json');
        const filtered = items.filter(i => i.id !== id);
        if (filtered.length === items.length) return false;
        writeFile('items.json', filtered);
        return true;
      },
    },
    messages: {
      getAll: async () => readFile<Message>('messages.json'),
      getByConversation: async (conversationId: string) => 
        readFile<Message>('messages.json')
          .filter(m => m.conversationId === conversationId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      create: async (message: Message) => {
        const messages = readFile<Message>('messages.json');
        messages.push(message);
        writeFile('messages.json', messages);
        return message;
      },
      markAsRead: async (conversationId: string, userId: string) => {
        const messages = readFile<Message>('messages.json');
        writeFile('messages.json', messages.map(m => 
          m.conversationId === conversationId && m.receiverId === userId && !m.read ? { ...m, read: true } : m
        ));
      },
    },
    conversations: {
      getAll: async () => readFile<Conversation>('conversations.json'),
      getByUser: async (userId: string) => 
        readFile<Conversation>('conversations.json').filter(c => c.buyerId === userId || c.sellerId === userId),
      getById: async (id: string) => readFile<Conversation>('conversations.json').find(c => c.id === id),
      getByItemAndBuyer: async (itemId: string, buyerId: string) => 
        readFile<Conversation>('conversations.json').find(c => c.itemId === itemId && c.buyerId === buyerId),
      create: async (conversation: Conversation) => {
        const conversations = readFile<Conversation>('conversations.json');
        conversations.push(conversation);
        writeFile('conversations.json', conversations);
        return conversation;
      },
      update: async (id: string, updates: Partial<Conversation>) => {
        const conversations = readFile<Conversation>('conversations.json');
        const index = conversations.findIndex(c => c.id === id);
        if (index === -1) return null;
        conversations[index] = { ...conversations[index], ...updates };
        writeFile('conversations.json', conversations);
        return conversations[index];
      },
    },
    otps: {
      getAll: async () => readFile<OTP>('otps.json'),
      getByEmail: async (email: string) => {
        const otps = readFile<OTP>('otps.json').filter(o => o.email === email);
        return otps.length === 0 ? undefined : otps.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      },
      create: async (otp: OTP) => {
        const otps = readFile<OTP>('otps.json').filter(o => o.email !== otp.email);
        otps.push(otp);
        writeFile('otps.json', otps);
        return otp;
      },
      delete: async (email: string) => {
        writeFile('otps.json', readFile<OTP>('otps.json').filter(o => o.email !== email));
      },
      cleanup: async () => {
        const now = new Date();
        writeFile('otps.json', readFile<OTP>('otps.json').filter(o => new Date(o.expiresAt) > now));
      },
    },
  };
}


export const db = createDb() as unknown as typeof supabaseDb;
