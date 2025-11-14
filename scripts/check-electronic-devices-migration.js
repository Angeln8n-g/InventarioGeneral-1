/**
 * Check Electronic Devices Migration
 * 
 * This script verifies if the electronic_devices table migration has been applied.
 * 
 * Usage: node scripts/check-electronic-devices-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Environment variables not configured');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log('🔍 Checking electronic_devices migration status...\n');

  try {
    // 1. Check if electronic_devices table exists
    console.log('1. Checking if electronic_devices table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('electronic_devices')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('   ❌ Table "electronic_devices" does NOT exist');
        console.log('\n📝 You need to apply the migration:');
        console.log('   👉 Option 1: Supabase Studio SQL Editor');
        console.log('      - Go to: https://app.supabase.com → SQL Editor');
        console.log('      - Copy content from: supabase/migrations/008_add_electronic_devices.sql');
        console.log('      - Execute the SQL');
        console.log('\n   👉 Option 2: Supabase CLI');
        console.log('      - Run: supabase db push');
        console.log('\n   👉 Option 3: Run migration script');
        console.log('      - Run: node scripts/apply-electronic-devices-migration.js');
        return false;
      }
      throw tableError;
    }
    console.log('   ✅ Table "electronic_devices" exists\n');

    // 2. Check if tool_instances table exists (dependency)
    console.log('2. Checking dependency: tool_instances table...');
    const { data: toolCheck, error: toolError } = await supabase
      .from('tool_instances')
      .select('id')
      .limit(1);

    if (toolError) {
      console.log('   ⚠️  Warning: tool_instances table not accessible');
    } else {
      console.log('   ✅ Dependency table exists\n');
    }

    // 3. Check if there are any electronic devices
    console.log('3. Checking for existing electronic devices...');
    const { data: devices, error: devicesError } = await supabase
      .from('electronic_devices')
      .select('id, brand, model')
      .limit(5);

    if (devicesError) {
      console.log('   ⚠️  Error checking devices:', devicesError.message);
    } else if (!devices || devices.length === 0) {
      console.log('   ℹ️  No electronic devices registered yet');
      console.log('   💡 You can start adding devices via the admin panel');
    } else {
      console.log(`   ✅ Found ${devices.length} electronic device(s)`);
      console.log('   📱 Sample devices:');
      devices.forEach(d => {
        const info = [
          d.brand,
          d.model
        ].filter(Boolean).join(' ') || 'No brand/model';
        console.log(`      - Device ID ${d.id}: ${info}`);
      });
    }

    console.log('\n✅ Migration verified successfully!');
    console.log('\n🎉 The electronic devices system is ready to use');
    console.log('👉 Access via: http://localhost:3000/admin/electronics');
    
    return true;

  } catch (error) {
    console.error('\n❌ Error verifying migration:', error.message);
    return false;
  }
}

checkMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
