/**
 * Migration script to move data from JSON files to Supabase
 * Run this after setting up Supabase and environment variables
 * 
 * Usage: node scripts/migrate-to-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataDir = path.join(process.cwd(), 'data');

async function migrateUsers() {
  const usersPath = path.join(dataDir, 'users.json');
  if (!fs.existsSync(usersPath)) {
    console.log('No users.json found, skipping users migration');
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    const { password, ...userData } = user;
    const { error } = await supabase.from('users').upsert(userData, { onConflict: 'id' });
    if (error) {
      console.error(`Error migrating user ${user.email}:`, error.message);
    } else {
      console.log(`✓ Migrated user: ${user.email}`);
    }
  }
}

async function migrateCategories() {
  const categoriesPath = path.join(dataDir, 'categories.json');
  if (!fs.existsSync(categoriesPath)) {
    console.log('No categories.json found, skipping categories migration');
    return;
  }

  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
  console.log(`Migrating ${categories.length} categories...`);

  for (const category of categories) {
    const { subcategories, ...categoryData } = category;
    
    // Insert category
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .upsert(categoryData, { onConflict: 'id' })
      .select()
      .single();

    if (catError) {
      console.error(`Error migrating category ${category.name}:`, catError.message);
      continue;
    }

    // Insert subcategories
    if (subcategories && subcategories.length > 0) {
      for (const subcat of subcategories) {
        const { error: subError } = await supabase
          .from('subcategories')
          .upsert(subcat, { onConflict: 'id' });
        
        if (subError) {
          console.error(`Error migrating subcategory ${subcat.name}:`, subError.message);
        }
      }
    }

    console.log(`✓ Migrated category: ${category.name}`);
  }
}

async function migrateItems() {
  const itemsPath = path.join(dataDir, 'items.json');
  if (!fs.existsSync(itemsPath)) {
    console.log('No items.json found, skipping items migration');
    return;
  }

  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
  console.log(`Migrating ${items.length} items...`);

  for (const item of items) {
    const { error } = await supabase.from('items').upsert(item, { onConflict: 'id' });
    if (error) {
      console.error(`Error migrating item ${item.title}:`, error.message);
    } else {
      console.log(`✓ Migrated item: ${item.title}`);
    }
  }
}

async function migrateConversations() {
  const conversationsPath = path.join(dataDir, 'conversations.json');
  if (!fs.existsSync(conversationsPath)) {
    console.log('No conversations.json found, skipping conversations migration');
    return;
  }

  const conversations = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
  console.log(`Migrating ${conversations.length} conversations...`);

  for (const conversation of conversations) {
    const { error } = await supabase.from('conversations').upsert(conversation, { onConflict: 'id' });
    if (error) {
      console.error(`Error migrating conversation ${conversation.id}:`, error.message);
    } else {
      console.log(`✓ Migrated conversation: ${conversation.id}`);
    }
  }
}

async function migrateMessages() {
  const messagesPath = path.join(dataDir, 'messages.json');
  if (!fs.existsSync(messagesPath)) {
    console.log('No messages.json found, skipping messages migration');
    return;
  }

  const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
  console.log(`Migrating ${messages.length} messages...`);

  for (const message of messages) {
    const { error } = await supabase.from('messages').upsert(message, { onConflict: 'id' });
    if (error) {
      console.error(`Error migrating message ${message.id}:`, error.message);
    } else {
      console.log(`✓ Migrated message: ${message.id}`);
    }
  }
}

async function main() {
  console.log('Starting migration to Supabase...\n');

  try {
    await migrateUsers();
    console.log('');
    await migrateCategories();
    console.log('');
    await migrateItems();
    console.log('');
    await migrateConversations();
    console.log('');
    await migrateMessages();
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

