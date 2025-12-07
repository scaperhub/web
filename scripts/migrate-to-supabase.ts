import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataDir = path.join(process.cwd(), 'data');

async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  try {
    // Migrate Users
    console.log('📦 Migrating users...');
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'));
    const { error: usersError } = await supabase.from('users').upsert(
      users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role || 'user',
        status: user.status || 'approved',
        userType: user.userType || 'hobbyist',
        emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
        verified: user.verified || false,
        following: user.following || [],
        createdAt: user.createdAt,
        bio: user.bio,
        avatar: user.avatar,
        backgroundPicture: user.backgroundPicture,
        country: user.country,
        city: user.city,
      })),
      { onConflict: 'id' }
    );
    if (usersError) throw usersError;
    console.log(`✅ Migrated ${users.length} users\n`);

    // Migrate Categories
    console.log('📦 Migrating categories...');
    const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));
    
    // First insert categories
    const { error: categoriesError } = await supabase.from('categories').upsert(
      categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        createdAt: cat.createdAt,
      })),
      { onConflict: 'id' }
    );
    if (categoriesError) throw categoriesError;
    
    // Then insert subcategories
    const allSubcategories: any[] = [];
    categories.forEach((cat: any) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub: any) => {
          allSubcategories.push({
            id: sub.id,
            name: sub.name,
            categoryId: cat.id,
            description: sub.description,
            createdAt: sub.createdAt,
          });
        });
      }
    });
    
    if (allSubcategories.length > 0) {
      const { error: subcategoriesError } = await supabase
        .from('subcategories')
        .upsert(allSubcategories, { onConflict: 'id' });
      if (subcategoriesError) throw subcategoriesError;
    }
    
    console.log(`✅ Migrated ${categories.length} categories and ${allSubcategories.length} subcategories\n`);

    // Migrate Items
    console.log('📦 Migrating items...');
    const items = JSON.parse(fs.readFileSync(path.join(dataDir, 'items.json'), 'utf-8'));
    const { error: itemsError } = await supabase.from('items').upsert(
      items.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        quantity: item.quantity || 1,
        images: item.images || [],
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId || null,
        sellerId: item.sellerId,
        status: item.status || 'available',
        approvalStatus: item.approvalStatus || 'approved',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        location: item.location,
        condition: item.condition,
      })),
      { onConflict: 'id' }
    );
    if (itemsError) throw itemsError;
    console.log(`✅ Migrated ${items.length} items\n`);

    // Migrate Conversations
    console.log('📦 Migrating conversations...');
    const conversations = JSON.parse(fs.readFileSync(path.join(dataDir, 'conversations.json'), 'utf-8'));
    const { error: conversationsError } = await supabase.from('conversations').upsert(
      conversations.map((conv: any) => ({
        id: conv.id,
        itemId: conv.itemId,
        buyerId: conv.buyerId,
        sellerId: conv.sellerId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt || conv.createdAt,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
      })),
      { onConflict: 'id' }
    );
    if (conversationsError) throw conversationsError;
    console.log(`✅ Migrated ${conversations.length} conversations\n`);

    // Migrate Messages
    console.log('📦 Migrating messages...');
    const messages = JSON.parse(fs.readFileSync(path.join(dataDir, 'messages.json'), 'utf-8'));
    const { error: messagesError } = await supabase.from('messages').upsert(
      messages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        itemId: msg.itemId,
        content: msg.content,
        createdAt: msg.createdAt,
        read: msg.read || false,
      })),
      { onConflict: 'id' }
    );
    if (messagesError) throw messagesError;
    console.log(`✅ Migrated ${messages.length} messages\n`);

    // Migrate OTPs (optional - usually not needed)
    if (fs.existsSync(path.join(dataDir, 'otps.json'))) {
      console.log('📦 Migrating OTPs...');
      const otps = JSON.parse(fs.readFileSync(path.join(dataDir, 'otps.json'), 'utf-8'));
      // Only migrate non-expired OTPs
      const now = new Date();
      const validOtps = otps.filter((otp: any) => new Date(otp.expiresAt) > now);
      
      if (validOtps.length > 0) {
        const { error: otpsError } = await supabase.from('otps').upsert(
          validOtps.map((otp: any) => ({
            id: otp.id,
            email: otp.email,
            code: otp.code,
            expiresAt: otp.expiresAt,
            createdAt: otp.createdAt,
          })),
          { onConflict: 'id' }
        );
        if (otpsError) throw otpsError;
        console.log(`✅ Migrated ${validOtps.length} valid OTPs\n`);
      } else {
        console.log('ℹ️  No valid OTPs to migrate\n');
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();



