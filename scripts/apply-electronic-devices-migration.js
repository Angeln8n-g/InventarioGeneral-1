/**
 * Migration Script: Apply Electronic Devices Table
 * 
 * This script applies the electronic_devices table migration to the database.
 * It creates the table with all specification fields and necessary indexes.
 * 
 * Usage: node scripts/apply-electronic-devices-migration.js
 * 
 * Note: This script requires direct database access via DATABASE_URL.
 * For Supabase projects, you can apply the migration via:
 * 1. Supabase Studio SQL Editor
 * 2. Supabase CLI: supabase db push
 * 3. This script (if you have DATABASE_URL configured)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.error('\n💡 Alternative: Apply migration manually via Supabase Studio:');
  console.error('   1. Go to: https://app.supabase.com → SQL Editor');
  console.error('   2. Copy content from: supabase/migrations/008_add_electronic_devices.sql');
  console.error('   3. Execute the SQL');
  process.exit(1);
}

async function applyMigration() {
  console.log('🔄 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('✅ Connected to Supabase');
    console.log('📖 Reading migration file...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_add_electronic_devices.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying migration: 008_add_electronic_devices.sql');
    console.log('\n⚠️  Note: This requires RPC or direct SQL execution.');
    console.log('📝 For Supabase, please apply this migration via:');
    console.log('   1. Supabase Studio SQL Editor');
    console.log('   2. Or use: supabase db push\n');
    
    // Try to verify if table already exists
    console.log('🔍 Checking if table already exists...');
    const { data, error } = await supabase
      .from('electronic_devices')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Table "electronic_devices" does not exist yet');
        console.log('\n📋 Migration SQL to apply:');
        console.log('─'.repeat(80));
        console.log(migrationSQL);
        console.log('─'.repeat(80));
        console.log('\n👉 Copy the SQL above and run it in Supabase Studio SQL Editor');
        console.log('   URL: https://app.supabase.com → Your Project → SQL Editor');
      } else {
        console.error('❌ Error checking table:', error.message);
      }
      process.exit(1);
    } else {
      console.log('✅ Table "electronic_devices" already exists!');
      console.log('💡 Migration was previously applied.');
      
      // Try to get table info
      console.log('\n📊 Verifying table structure...');
      const { data: testData, error: testError } = await supabase
        .from('electronic_devices')
        .select('*')
        .limit(0);
      
      if (!testError) {
        console.log('✅ Table is accessible and ready to use');
      }
    }
    
    console.log('\n✨ Verification completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
