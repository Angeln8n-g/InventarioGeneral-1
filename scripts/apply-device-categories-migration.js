/**
 * Migration Script: Apply Device Categories Migrations (017-020)
 * 
 * This script applies the device categories migration set which introduces
 * dynamic category management for electronic devices.
 * 
 * Usage: node apply-device-categories-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files in order
const migrations = [
  '017_device_categories.sql',
  '018_category_fields.sql',
  '019_device_custom_fields.sql',
  '020_populate_device_categories.sql'
];

/**
 * Read SQL file content
 */
function readMigrationFile(filename) {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Apply a single migration using Supabase SQL editor
 */
async function applyMigration(filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  try {
    const sql = readMigrationFile(filename);
    
    // Execute SQL using Supabase REST API
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
      // If exec_sql RPC doesn't exist, try direct SQL execution
      console.log('   Using direct SQL execution...');
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          throw new Error(`SQL Error: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying ${filename}:`, error.message);
    return false;
  }
}

/**
 * Verify migration results
 */
async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations...\n');
  
  try {
    // Check device_categories table
    const { data: categories, error: catError } = await supabase
      .from('device_categories')
      .select('*', { count: 'exact' });
    
    if (catError) throw catError;
    console.log(`✅ device_categories table: ${categories?.length || 0} categories`);
    
    // Check category_fields table
    const { data: fields, error: fieldsError } = await supabase
      .from('category_fields')
      .select('*', { count: 'exact' });
    
    if (fieldsError) throw fieldsError;
    console.log(`✅ category_fields table: ${fields?.length || 0} field configurations`);
    
    // List all categories
    if (categories && categories.length > 0) {
      console.log('\n📋 Device Categories:');
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id}, Icon: ${cat.icon}, Active: ${cat.is_active})`);
      });
    }
    
    // List field configurations
    if (fields && fields.length > 0) {
      console.log('\n📋 Field Configurations:');
      
      // Group by category
      const fieldsByCategory = {};
      for (const field of fields) {
        const category = categories.find(c => c.id === field.category_id);
        const categoryName = category?.name || 'Unknown';
        if (!fieldsByCategory[categoryName]) {
          fieldsByCategory[categoryName] = [];
        }
        fieldsByCategory[categoryName].push(field);
      }
      
      Object.entries(fieldsByCategory).forEach(([categoryName, categoryFields]) => {
        console.log(`\n   ${categoryName}:`);
        categoryFields
          .sort((a, b) => a.display_order - b.display_order)
          .forEach(field => {
            console.log(`      - ${field.field_name} (${field.field_type}, ${field.is_required ? 'required' : 'optional'})`);
          });
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Device Categories Migration (017-020)');
  console.log('================================================\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Apply each migration
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.error('\n⚠️  Migration failed. Stopping execution.');
      break;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful migrations: ${successCount}`);
  console.log(`❌ Failed migrations: ${failCount}`);
  console.log('='.repeat(50));
  
  if (failCount === 0) {
    // Verify results
    const verified = await verifyMigrations();
    
    if (verified) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Update TypeScript types in src/types/');
      console.log('2. Create API endpoints for category management');
      console.log('3. Update device forms to use dynamic fields');
      console.log('4. Implement category management UI');
    }
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    console.log('\nTo manually rollback, run the rollback scripts in reverse order:');
    console.log('  020_populate_device_categories_rollback.sql');
    console.log('  019_device_custom_fields_rollback.sql');
    console.log('  018_category_fields_rollback.sql');
    console.log('  017_device_categories_rollback.sql');
    process.exit(1);
  }
}

// Run migrations
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
