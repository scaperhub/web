# Database Migration Guide

This guide will help you migrate from JSON file-based storage to a PostgreSQL database for production deployment.

## Step 1: Install Dependencies

```bash
npm install pg @types/pg
# OR use Prisma (recommended for better type safety)
npm install prisma @prisma/client
npm install -D prisma
```

## Step 2: Choose Your Approach

### Option A: Prisma ORM (Recommended)
- Type-safe database queries
- Automatic migrations
- Better developer experience

### Option B: Raw PostgreSQL (pg)
- More control
- Direct SQL queries
- Lighter weight

---

## Option A: Using Prisma (Recommended)

### 1. Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

### 2. Update `.env` file

```env
DATABASE_URL="postgresql://username:password@localhost:5432/scaperhub?schema=public"
JWT_SECRET="your-secret-key-here"
NODE_ENV="production"
```

### 3. Create Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env(DATABASE_URL)
}

model User {
  id               String   @id @default(uuid())
  username         String   @unique
  email            String   @unique
  password         String
  name             String
  role             String   @default("user") // 'user' | 'admin'
  status           String   @default("pending") // 'pending' | 'approved' | 'rejected'
  userType         String   @default("hobbyist") // 'hobbyist' | 'shop'
  emailVerified    Boolean  @default(false)
  verified         Boolean  @default(false)
  following        String[] @default([])
  createdAt        DateTime @default(now())
  bio              String?
  avatar           String?
  backgroundPicture String?
  country          String?
  city             String?
  
  items            Item[]
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  buyerConversations Conversation[] @relation("Buyer")
  sellerConversations Conversation[] @relation("Seller")
}

model Category {
  id          String        @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime      @default(now())
  subcategories Subcategory[]
}

model Subcategory {
  id          String   @id @default(uuid())
  name        String
  categoryId  String
  description String?
  createdAt   DateTime @default(now())
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  items       Item[]
  
  @@index([categoryId])
}

model Item {
  id            String   @id @default(uuid())
  title         String
  description   String
  price         Float
  quantity      Int      @default(1)
  images        String[]
  categoryId    String
  subcategoryId String?
  sellerId      String
  status        String   @default("available") // 'available' | 'sold' | 'pending'
  approvalStatus String  @default("pending") // 'pending' | 'approved' | 'rejected'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  location      String?
  condition     String? // 'new' | 'used' | 'refurbished'
  
  category      Category @relation(fields: [categoryId], references: [id])
  subcategory   Subcategory? @relation(fields: [subcategoryId], references: [id])
  seller        User @relation(fields: [sellerId], references: [id])
  conversations Conversation[]
  messages      Message[]
  
  @@index([sellerId])
  @@index([categoryId])
  @@index([subcategoryId])
  @@index([approvalStatus])
}

model Message {
  id            String   @id @default(uuid())
  conversationId String
  senderId      String
  receiverId   String
  itemId       String
  content      String
  createdAt    DateTime @default(now())
  read         Boolean  @default(false)
  
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User @relation("SentMessages", fields: [senderId], references: [id])
  receiver     User @relation("ReceivedMessages", fields: [receiverId], references: [id])
  item         Item @relation(fields: [itemId], references: [id])
  
  @@index([conversationId])
  @@index([senderId])
  @@index([receiverId])
}

model Conversation {
  id           String    @id @default(uuid())
  itemId       String
  buyerId      String
  sellerId     String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastMessage String?
  lastMessageAt DateTime?
  
  item         Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  buyer        User @relation("Buyer", fields: [buyerId], references: [id])
  seller       User @relation("Seller", fields: [sellerId], references: [id])
  messages     Message[]
  
  @@unique([itemId, buyerId])
  @@index([buyerId])
  @@index([sellerId])
}

model OTP {
  id        String   @id @default(uuid())
  email     String
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([expiresAt])
}
```

### 4. Create and Run Migration

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Create New Database Module

Create `lib/db-prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { User, Category, Item, Message, Conversation, OTP } from './types';

const prisma = new PrismaClient();

// Helper to convert Prisma types to app types
const toUser = (user: any): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  password: user.password,
  name: user.name,
  role: user.role as 'user' | 'admin',
  status: user.status as 'pending' | 'approved' | 'rejected',
  userType: user.userType as 'hobbyist' | 'shop',
  emailVerified: user.emailVerified,
  verified: user.verified,
  following: user.following,
  createdAt: user.createdAt.toISOString(),
  bio: user.bio || undefined,
  avatar: user.avatar || undefined,
  backgroundPicture: user.backgroundPicture || undefined,
  country: user.country || undefined,
  city: user.city || undefined,
});

export const db = {
  users: {
    getAll: async (): Promise<User[]> => {
      const users = await prisma.user.findMany();
      return users.map(toUser);
    },
    getByEmail: async (email: string): Promise<User | undefined> => {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ? toUser(user) : undefined;
    },
    getById: async (id: string): Promise<User | undefined> => {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? toUser(user) : undefined;
    },
    getByUsername: async (username: string): Promise<User | undefined> => {
      const user = await prisma.user.findUnique({ where: { username } });
      return user ? toUser(user) : undefined;
    },
    create: async (user: User): Promise<User> => {
      const created = await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          status: user.status,
          userType: user.userType,
          emailVerified: user.emailVerified,
          verified: user.verified,
          following: user.following,
          createdAt: new Date(user.createdAt),
          bio: user.bio,
          avatar: user.avatar,
          backgroundPicture: user.backgroundPicture,
          country: user.country,
          city: user.city,
        },
      });
      return toUser(created);
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...updates,
          createdAt: updates.createdAt ? new Date(updates.createdAt) : undefined,
        },
      });
      return toUser(updated);
    },
  },
  categories: {
    getAll: async (): Promise<Category[]> => {
      const categories = await prisma.category.findMany({
        include: { subcategories: true },
      });
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        createdAt: cat.createdAt.toISOString(),
        subcategories: cat.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt.toISOString(),
        })),
      }));
    },
    getById: async (id: string): Promise<Category | undefined> => {
      const category = await prisma.category.findUnique({
        where: { id },
        include: { subcategories: true },
      });
      if (!category) return undefined;
      return {
        id: category.id,
        name: category.name,
        description: category.description || undefined,
        createdAt: category.createdAt.toISOString(),
        subcategories: category.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt.toISOString(),
        })),
      };
    },
    create: async (category: Category): Promise<Category> => {
      const created = await prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: new Date(category.createdAt),
          subcategories: {
            create: category.subcategories.map(sub => ({
              id: sub.id,
              name: sub.name,
              description: sub.description,
              createdAt: new Date(sub.createdAt),
            })),
          },
        },
        include: { subcategories: true },
      });
      return {
        id: created.id,
        name: created.name,
        description: created.description || undefined,
        createdAt: created.createdAt.toISOString(),
        subcategories: created.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt.toISOString(),
        })),
      };
    },
    update: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          subcategories: updates.subcategories
            ? {
                deleteMany: {},
                create: updates.subcategories.map(sub => ({
                  id: sub.id,
                  name: sub.name,
                  description: sub.description,
                  createdAt: new Date(sub.createdAt),
                })),
              }
            : undefined,
        },
        include: { subcategories: true },
      });
      return {
        id: updated.id,
        name: updated.name,
        description: updated.description || undefined,
        createdAt: updated.createdAt.toISOString(),
        subcategories: updated.subcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          description: sub.description || undefined,
          createdAt: sub.createdAt.toISOString(),
        })),
      };
    },
    delete: async (id: string): Promise<boolean> => {
      try {
        await prisma.category.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    },
  },
  items: {
    getAll: async (): Promise<Item[]> => {
      const items = await prisma.item.findMany();
      return items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        images: item.images,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || '',
        sellerId: item.sellerId,
        status: item.status as 'available' | 'sold' | 'pending',
        approvalStatus: item.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        location: item.location || undefined,
        condition: item.condition as 'new' | 'used' | 'refurbished' | undefined,
      }));
    },
    getById: async (id: string): Promise<Item | undefined> => {
      const item = await prisma.item.findUnique({ where: { id } });
      if (!item) return undefined;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        images: item.images,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || '',
        sellerId: item.sellerId,
        status: item.status as 'available' | 'sold' | 'pending',
        approvalStatus: item.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        location: item.location || undefined,
        condition: item.condition as 'new' | 'used' | 'refurbished' | undefined,
      };
    },
    getBySeller: async (sellerId: string): Promise<Item[]> => {
      const items = await prisma.item.findMany({ where: { sellerId } });
      return items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        images: item.images,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || '',
        sellerId: item.sellerId,
        status: item.status as 'available' | 'sold' | 'pending',
        approvalStatus: item.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        location: item.location || undefined,
        condition: item.condition as 'new' | 'used' | 'refurbished' | undefined,
      }));
    },
    getByCategory: async (categoryId: string): Promise<Item[]> => {
      const items = await prisma.item.findMany({ where: { categoryId } });
      return items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        images: item.images,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || '',
        sellerId: item.sellerId,
        status: item.status as 'available' | 'sold' | 'pending',
        approvalStatus: item.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        location: item.location || undefined,
        condition: item.condition as 'new' | 'used' | 'refurbished' | undefined,
      }));
    },
    create: async (item: Item): Promise<Item> => {
      const created = await prisma.item.create({
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          images: item.images,
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId || null,
          sellerId: item.sellerId,
          status: item.status,
          approvalStatus: item.approvalStatus,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          location: item.location,
          condition: item.condition,
        },
      });
      return {
        id: created.id,
        title: created.title,
        description: created.description,
        price: created.price,
        quantity: created.quantity,
        images: created.images,
        categoryId: created.categoryId,
        subcategoryId: created.subcategoryId || '',
        sellerId: created.sellerId,
        status: created.status as 'available' | 'sold' | 'pending',
        approvalStatus: created.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        location: created.location || undefined,
        condition: created.condition as 'new' | 'used' | 'refurbished' | undefined,
      };
    },
    update: async (id: string, updates: Partial<Item>): Promise<Item | null> => {
      const updated = await prisma.item.update({
        where: { id },
        data: {
          ...updates,
          createdAt: updates.createdAt ? new Date(updates.createdAt) : undefined,
          updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : undefined,
        },
      });
      return {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        price: updated.price,
        quantity: updated.quantity,
        images: updated.images,
        categoryId: updated.categoryId,
        subcategoryId: updated.subcategoryId || '',
        sellerId: updated.sellerId,
        status: updated.status as 'available' | 'sold' | 'pending',
        approvalStatus: updated.approvalStatus as 'pending' | 'approved' | 'rejected',
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        location: updated.location || undefined,
        condition: updated.condition as 'new' | 'used' | 'refurbished' | undefined,
      };
    },
    delete: async (id: string): Promise<boolean> => {
      try {
        await prisma.item.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    },
  },
  messages: {
    getAll: async (): Promise<Message[]> => {
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: 'asc' },
      });
      return messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        itemId: msg.itemId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        read: msg.read,
      }));
    },
    getByConversation: async (conversationId: string): Promise<Message[]> => {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });
      return messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        itemId: msg.itemId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        read: msg.read,
      }));
    },
    create: async (message: Message): Promise<Message> => {
      const created = await prisma.message.create({
        data: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          receiverId: message.receiverId,
          itemId: message.itemId,
          content: message.content,
          createdAt: new Date(message.createdAt),
          read: message.read,
        },
      });
      return {
        id: created.id,
        conversationId: created.conversationId,
        senderId: created.senderId,
        receiverId: created.receiverId,
        itemId: created.itemId,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        read: created.read,
      };
    },
    markAsRead: async (conversationId: string, userId: string): Promise<void> => {
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          read: false,
        },
        data: { read: true },
      });
    },
  },
  conversations: {
    getAll: async (): Promise<Conversation[]> => {
      const conversations = await prisma.conversation.findMany();
      return conversations.map(conv => ({
        id: conv.id,
        itemId: conv.itemId,
        buyerId: conv.buyerId,
        sellerId: conv.sellerId,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        lastMessage: conv.lastMessage || undefined,
        lastMessageAt: conv.lastMessageAt?.toISOString() || undefined,
      }));
    },
    getByUser: async (userId: string): Promise<Conversation[]> => {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      });
      return conversations.map(conv => ({
        id: conv.id,
        itemId: conv.itemId,
        buyerId: conv.buyerId,
        sellerId: conv.sellerId,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        lastMessage: conv.lastMessage || undefined,
        lastMessageAt: conv.lastMessageAt?.toISOString() || undefined,
      }));
    },
    getById: async (id: string): Promise<Conversation | undefined> => {
      const conversation = await prisma.conversation.findUnique({ where: { id } });
      if (!conversation) return undefined;
      return {
        id: conversation.id,
        itemId: conversation.itemId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        lastMessage: conversation.lastMessage || undefined,
        lastMessageAt: conversation.lastMessageAt?.toISOString() || undefined,
      };
    },
    getByItemAndBuyer: async (itemId: string, buyerId: string): Promise<Conversation | undefined> => {
      const conversation = await prisma.conversation.findUnique({
        where: {
          itemId_buyerId: {
            itemId,
            buyerId,
          },
        },
      });
      if (!conversation) return undefined;
      return {
        id: conversation.id,
        itemId: conversation.itemId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        lastMessage: conversation.lastMessage || undefined,
        lastMessageAt: conversation.lastMessageAt?.toISOString() || undefined,
      };
    },
    create: async (conversation: Conversation): Promise<Conversation> => {
      const created = await prisma.conversation.create({
        data: {
          id: conversation.id,
          itemId: conversation.itemId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          createdAt: new Date(conversation.createdAt),
          updatedAt: new Date(conversation.updatedAt),
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : null,
        },
      });
      return {
        id: created.id,
        itemId: created.itemId,
        buyerId: created.buyerId,
        sellerId: created.sellerId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        lastMessage: created.lastMessage || undefined,
        lastMessageAt: created.lastMessageAt?.toISOString() || undefined,
      };
    },
    update: async (id: string, updates: Partial<Conversation>): Promise<Conversation | null> => {
      const updated = await prisma.conversation.update({
        where: { id },
        data: {
          ...updates,
          createdAt: updates.createdAt ? new Date(updates.createdAt) : undefined,
          updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : undefined,
          lastMessageAt: updates.lastMessageAt ? new Date(updates.lastMessageAt) : undefined,
        },
      });
      return {
        id: updated.id,
        itemId: updated.itemId,
        buyerId: updated.buyerId,
        sellerId: updated.sellerId,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        lastMessage: updated.lastMessage || undefined,
        lastMessageAt: updated.lastMessageAt?.toISOString() || undefined,
      };
    },
  },
  otps: {
    getAll: async (): Promise<OTP[]> => {
      const otps = await prisma.oTP.findMany();
      return otps.map(otp => ({
        id: otp.id,
        email: otp.email,
        code: otp.code,
        expiresAt: otp.expiresAt.toISOString(),
        createdAt: otp.createdAt.toISOString(),
      }));
    },
    getByEmail: async (email: string): Promise<OTP | undefined> => {
      const otp = await prisma.oTP.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });
      if (!otp) return undefined;
      return {
        id: otp.id,
        email: otp.email,
        code: otp.code,
        expiresAt: otp.expiresAt.toISOString(),
        createdAt: otp.createdAt.toISOString(),
      };
    },
    create: async (otp: OTP): Promise<OTP> => {
      // Delete old OTPs for this email
      await prisma.oTP.deleteMany({ where: { email: otp.email } });
      
      const created = await prisma.oTP.create({
        data: {
          id: otp.id,
          email: otp.email,
          code: otp.code,
          expiresAt: new Date(otp.expiresAt),
          createdAt: new Date(otp.createdAt),
        },
      });
      return {
        id: created.id,
        email: created.email,
        code: created.code,
        expiresAt: created.expiresAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      };
    },
    delete: async (email: string): Promise<void> => {
      await prisma.oTP.deleteMany({ where: { email } });
    },
    cleanup: async (): Promise<void> => {
      await prisma.oTP.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
    },
  },
};

export default prisma;
```

### 7. Update API Routes to Use Async

All API routes need to be updated to use `async/await` since database operations are now asynchronous.

Example for `pages/api/items/index.ts`:

```typescript
// Change from:
const items = db.items.getAll();

// To:
const items = await db.items.getAll();
```

### 8. Create Migration Script

Create `scripts/migrate-to-db.ts` to migrate existing JSON data:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'data');

async function migrate() {
  console.log('Starting migration...');

  // Migrate Users
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        status: user.status || 'approved',
        userType: user.userType || 'hobbyist',
        emailVerified: user.emailVerified || true,
        verified: user.verified || false,
        following: user.following || [],
        createdAt: new Date(user.createdAt),
        bio: user.bio,
        avatar: user.avatar,
        backgroundPicture: user.backgroundPicture,
        country: user.country,
        city: user.city,
      },
    });
  }
  console.log(`Migrated ${users.length} users`);

  // Migrate Categories
  const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));
  for (const category of categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: new Date(category.createdAt),
        subcategories: {
          create: category.subcategories.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            description: sub.description,
            createdAt: new Date(sub.createdAt),
          })),
        },
      },
    });
  }
  console.log(`Migrated ${categories.length} categories`);

  // Migrate Items
  const items = JSON.parse(fs.readFileSync(path.join(dataDir, 'items.json'), 'utf-8'));
  for (const item of items) {
    await prisma.item.create({
      data: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity || 1,
        images: item.images,
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || null,
        sellerId: item.sellerId,
        status: item.status,
        approvalStatus: item.approvalStatus || 'approved',
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        location: item.location,
        condition: item.condition,
      },
    });
  }
  console.log(`Migrated ${items.length} items`);

  // Migrate Conversations
  const conversations = JSON.parse(fs.readFileSync(path.join(dataDir, 'conversations.json'), 'utf-8'));
  for (const conv of conversations) {
    await prisma.conversation.create({
      data: {
        id: conv.id,
        itemId: conv.itemId,
        buyerId: conv.buyerId,
        sellerId: conv.sellerId,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : null,
      },
    });
  }
  console.log(`Migrated ${conversations.length} conversations`);

  // Migrate Messages
  const messages = JSON.parse(fs.readFileSync(path.join(dataDir, 'messages.json'), 'utf-8'));
  for (const msg of messages) {
    await prisma.message.create({
      data: {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        itemId: msg.itemId,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
        read: msg.read || false,
      },
    });
  }
  console.log(`Migrated ${messages.length} messages`);

  console.log('Migration completed!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run migration:
```bash
npx ts-node scripts/migrate-to-db.ts
```

### 9. Switch to Database

Update `lib/db.ts` to export from the new database module:

```typescript
// Use environment variable to switch between JSON and DB
const USE_DATABASE = process.env.USE_DATABASE === 'true';

if (USE_DATABASE) {
  module.exports = require('./db-prisma');
} else {
  module.exports = require('./db-json'); // Keep old implementation
}
```

Or simply replace the entire `lib/db.ts` with the Prisma version.

---

## Deployment Steps

### 1. Set up PostgreSQL Database

**Option A: Managed Database (Recommended)**
- **Vercel**: Use Vercel Postgres
- **Railway**: Built-in PostgreSQL
- **Supabase**: Free PostgreSQL hosting
- **AWS RDS**: Production-grade
- **DigitalOcean**: Managed databases

**Option B: Self-hosted**
```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb scaperhub

# Create user
sudo -u postgres psql
CREATE USER scaperhub_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scaperhub TO scaperhub_user;
```

### 2. Environment Variables

Create `.env.production`:
```env
DATABASE_URL="postgresql://username:password@host:5432/scaperhub"
JWT_SECRET="your-production-secret-key"
NODE_ENV="production"
```

### 3. Deploy

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Railway:**
```bash
railway login
railway init
railway up
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 4. Run Migrations in Production

```bash
npx prisma migrate deploy
```

---

## Important Notes

1. **Backup JSON files** before migration
2. **Test migration** on a staging environment first
3. **Update all API routes** to use async/await
4. **Set up connection pooling** for production
5. **Monitor database performance**
6. **Set up regular backups**

---

## Need Help?

If you encounter issues:
1. Check Prisma logs: `npx prisma studio` (opens database GUI)
2. Verify connection: Test DATABASE_URL
3. Check migrations: `npx prisma migrate status`
4. Review Prisma docs: https://www.prisma.io/docs



