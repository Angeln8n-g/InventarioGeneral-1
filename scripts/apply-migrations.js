const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migrations to apply in order
const migrations = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_sample_data.sql',
  '004_add_full_name_and_update_roles.sql',
  '20250106_notification_preferences.sql'
];

async function applyMigration(filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', filename);
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`⚠️  Migration file not found: ${filename}`);
    return false;
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('   Trying direct execution...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
    
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful migrations: ${successCount}`);
  console.log(`❌ Failed migrations: ${failCount}`);
  console.log('='.repeat(50));
  
  if (failCount === 0) {
    console.log('\n🎉 All migrations applied successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
  }
}

main().catch(console.error);
