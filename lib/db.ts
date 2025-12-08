// Clean JSON-backed db implementation mirroring supabase shape.
import fs from 'fs';
import path from 'path';
import { db as supabaseDb } from './db-supabase';
import { User, Category, Item, Message, Conversation, OTP } from './types';

const USE_SUPABASE =
  process.env.USE_SUPABASE === 'true' ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function readJson<T>(p: string): T[] {
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJson<T>(p: string, data: T[]) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function createDb(): typeof supabaseDb {
  if (USE_SUPABASE) return supabaseDb;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const f = (name: string) => path.join(dataDir, name);

  const ensureItemsMigrated = () => {
    const items = readJson<Item>(f('items.json'));
    let changed = false;

    const migrated = items.map(item => {
      const updated = { ...item };
      if (updated.approvalStatus === undefined) {
        updated.approvalStatus = 'approved';
        changed = true;
      }
      if (updated.quantity === undefined) {
        updated.quantity = 1;
        changed = true;
      }
      return updated;
    });

    if (changed) {
      writeJson(f('items.json'), migrated);
    }

    return migrated;
  };

  const dbJson = {
    users: {
      getAll: async () => readJson<User>(f('users.json')),
      getByEmail: async (email: string) => readJson<User>(f('users.json')).find(u => u.email === email),
      getById: async (id: string) => readJson<User>(f('users.json')).find(u => u.id === id),
      getByUsername: async (username: string) => readJson<User>(f('users.json')).find(u => u.username === username),
      create: async (user: User) => {
        const users = readJson<User>(f('users.json'));
        users.push(user);
        writeJson(f('users.json'), users);
        return user;
      },
      update: async (id: string, updates: Partial<User>) => {
        const users = readJson<User>(f('users.json'));
        const i = users.findIndex(u => u.id === id);
        if (i === -1) return null;
        users[i] = { ...users[i], ...updates };
        writeJson(f('users.json'), users);
        return users[i];
      },
      delete: async (id: string) => {
        // cascade delete
        writeJson(f('items.json'), readJson<Item>(f('items.json')).filter(i => i.sellerId !== id));
        writeJson(
          f('conversations.json'),
          readJson<Conversation>(f('conversations.json')).filter(c => c.buyerId !== id && c.sellerId !== id)
        );
        writeJson(
          f('messages.json'),
          readJson<Message>(f('messages.json')).filter(m => m.senderId !== id && m.receiverId !== id)
        );
        const users = readJson<User>(f('users.json'));
        const userEmail = users.find(u => u.id === id)?.email;
        if (userEmail) {
          writeJson(f('otps.json'), readJson<OTP>(f('otps.json')).filter(o => o.email !== userEmail));
        }
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return false;
        writeJson(f('users.json'), filtered);
        return true;
      },
    },
    categories: {
      getAll: async () => readJson<Category>(f('categories.json')),
      getById: async (id: string) => readJson<Category>(f('categories.json')).find(c => c.id === id),
      create: async (category: Category) => {
        const categories = readJson<Category>(f('categories.json'));
        categories.push(category);
        writeJson(f('categories.json'), categories);
        return category;
      },
      update: async (id: string, updates: Partial<Category>) => {
        const categories = readJson<Category>(f('categories.json'));
        const idx = categories.findIndex(c => c.id === id);
        if (idx === -1) return null;
        categories[idx] = { ...categories[idx], ...updates };
        writeJson(f('categories.json'), categories);
        return categories[idx];
      },
      delete: async (id: string) => {
        const categories = readJson<Category>(f('categories.json'));
        const filtered = categories.filter(c => c.id !== id);
        if (filtered.length === categories.length) return false;
        writeJson(f('categories.json'), filtered);
        return true;
      },
    },
    items: {
      getAll: async () => {
        return ensureItemsMigrated();
      },
      getById: async (id: string) => ensureItemsMigrated().find(i => i.id === id),
      getBySeller: async (sellerId: string) => ensureItemsMigrated().filter(i => i.sellerId === sellerId),
      getByCategory: async (categoryId: string) =>
        ensureItemsMigrated().filter(i => i.categoryId === categoryId),
      create: async (item: Item) => {
        const items = readJson<Item>(f('items.json'));
        items.push(item);
        writeJson(f('items.json'), items);
        return item;
      },
      update: async (id: string, updates: Partial<Item>) => {
        const items = readJson<Item>(f('items.json'));
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...updates };
        writeJson(f('items.json'), items);
        return items[idx];
      },
      delete: async (id: string) => {
        const items = readJson<Item>(f('items.json'));
        const filtered = items.filter(i => i.id !== id);
        if (filtered.length === items.length) return false;
        writeJson(f('items.json'), filtered);
        return true;
      },
    },
    messages: {
      getAll: async () => readJson<Message>(f('messages.json')),
      getById: async (id: string) => readJson<Message>(f('messages.json')).find(m => m.id === id),
      getByConversation: async (conversationId: string) =>
        readJson<Message>(f('messages.json'))
          .filter(m => m.conversationId === conversationId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      markAsRead: async (conversationId: string, userId: string) => {
        const messages = readJson<Message>(f('messages.json'));
        let changed = false;

        const updated = messages.map(m => {
          if (m.conversationId === conversationId && m.receiverId === userId && !m.read) {
            changed = true;
            return { ...m, read: true };
          }
          return m;
        });

        if (changed) {
          writeJson(f('messages.json'), updated);
        }
      },
      create: async (message: Message) => {
        const messages = readJson<Message>(f('messages.json'));
        messages.push(message);
        writeJson(f('messages.json'), messages);
        return message;
      },
      update: async (id: string, updates: Partial<Message>) => {
        const messages = readJson<Message>(f('messages.json'));
        const idx = messages.findIndex(m => m.id === id);
        if (idx === -1) return null;
        messages[idx] = { ...messages[idx], ...updates };
        writeJson(f('messages.json'), messages);
        return messages[idx];
      },
      delete: async (id: string) => {
        const messages = readJson<Message>(f('messages.json'));
        const filtered = messages.filter(m => m.id !== id);
        if (filtered.length === messages.length) return false;
        writeJson(f('messages.json'), filtered);
        return true;
      },
    },
    conversations: {
      getAll: async () => readJson<Conversation>(f('conversations.json')),
      getByUser: async (userId: string) =>
        readJson<Conversation>(f('conversations.json')).filter(
          c => c.buyerId === userId || c.sellerId === userId
        ),
      getById: async (id: string) => readJson<Conversation>(f('conversations.json')).find(c => c.id === id),
      getByItemAndBuyer: async (itemId: string, buyerId: string) =>
        readJson<Conversation>(f('conversations.json')).find(
          c => c.itemId === itemId && c.buyerId === buyerId
        ),
      create: async (conversation: Conversation) => {
        const conversations = readJson<Conversation>(f('conversations.json'));
        conversations.push(conversation);
        writeJson(f('conversations.json'), conversations);
        return conversation;
      },
      update: async (id: string, updates: Partial<Conversation>) => {
        const conversations = readJson<Conversation>(f('conversations.json'));
        const idx = conversations.findIndex(c => c.id === id);
        if (idx === -1) return null;
        conversations[idx] = { ...conversations[idx], ...updates };
        writeJson(f('conversations.json'), conversations);
        return conversations[idx];
      },
      delete: async (id: string) => {
        const messages = readJson<Message>(f('messages.json'));
        writeJson(f('messages.json'), messages.filter(m => m.conversationId !== id));
        const conversations = readJson<Conversation>(f('conversations.json'));
        const filtered = conversations.filter(c => c.id !== id);
        if (filtered.length === conversations.length) return false;
        writeJson(f('conversations.json'), filtered);
        return true;
      },
    },
    otps: {
      getAll: async () => readJson<OTP>(f('otps.json')),
      getByEmail: async (email: string) =>
        readJson<OTP>(f('otps.json'))
          .filter(o => o.email === email)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
      create: async (otp: OTP) => {
        const otps = readJson<OTP>(f('otps.json')).filter(o => o.email !== otp.email);
        otps.push(otp);
        writeJson(f('otps.json'), otps);
        return otp;
      },
      delete: async (email: string) => {
        writeJson(f('otps.json'), readJson<OTP>(f('otps.json')).filter(o => o.email !== email));
      },
      cleanup: async () => {
        const now = new Date();
        writeJson(
          f('otps.json'),
          readJson<OTP>(f('otps.json')).filter(o => new Date(o.expiresAt) > now)
        );
      },
    },
  } as unknown as typeof supabaseDb;

  return dbJson;
}

export const db: any = createDb();
