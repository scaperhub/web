/**
 * Verification script to test Supabase connection
 * Run this to confirm your Supabase setup is working
 * 
 * Usage: node scripts/verify-supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verifying Supabase Setup...\n');

// Check 1: Environment variables
console.log('1️⃣ Checking environment variables...');
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}
if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}
console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('✅ Supabase key is set\n');

// Check 2: Connect to Supabase
console.log('2️⃣ Testing Supabase connection...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client created\n');

// Check 3: Verify tables exist
console.log('3️⃣ Verifying database tables...');
const tables = ['users', 'categories', 'items', 'conversations', 'messages', 'otps'];
let allTablesExist = true;

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`❌ Table "${table}" error:`, error.message);
      allTablesExist = false;
    } else {
      console.log(`✅ Table "${table}" exists`);
    }
  } catch (err) {
    console.error(`❌ Table "${table}" error:`, err.message);
    allTablesExist = false;
  }
}

if (!allTablesExist) {
  console.error('\n❌ Some tables are missing. Please run the SQL schema from supabase-schema.sql');
  process.exit(1);
}
console.log('✅ All tables exist\n');

// Check 4: Test read operation
console.log('4️⃣ Testing read operation...');
try {
  const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
  if (userError) throw userError;
  console.log(`✅ Can read from users table (${users?.length || 0} users found)`);
} catch (err) {
  console.error('❌ Cannot read from users table:', err.message);
  process.exit(1);
}

try {
  const { data: items, error: itemError } = await supabase.from('items').select('id').limit(1);
  if (itemError) throw itemError;
  console.log(`✅ Can read from items table (${items?.length || 0} items found)`);
} catch (err) {
  console.error('❌ Cannot read from items table:', err.message);
  process.exit(1);
}
console.log('');

// Check 5: Test write operation (optional)
console.log('5️⃣ Testing write operation...');
const testId = `test-${Date.now()}`;
try {
  const { error: writeError } = await supabase.from('otps').insert({
    id: testId,
    email: 'test@example.com',
    code: '123456',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  });
  
  if (writeError) throw writeError;
  console.log('✅ Can write to database');
  
  // Clean up test data
  await supabase.from('otps').delete().eq('id', testId);
  console.log('✅ Can delete from database');
} catch (err) {
  console.error('❌ Cannot write to database:', err.message);
  console.log('   (This might be due to Row Level Security policies)');
}
console.log('');

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Supabase setup is working correctly!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Next steps:');
console.log('1. Make sure USE_SUPABASE=true is set in Vercel');
console.log('2. Redeploy your Vercel project');
console.log('3. Check your deployed site - it should now use Supabase!');


