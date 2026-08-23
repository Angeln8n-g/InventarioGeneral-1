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

async function applyCableMarkersMigration() {
  console.log('🚀 Applying cable markers migration...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '015_add_cable_markers.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found: 015_add_cable_markers.sql');
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw error;
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Cable markers migration applied successfully!');
    console.log('='.repeat(60));
    console.log('\nAdded columns:');
    console.log('  - stock_movements.start_marker');
    console.log('  - stock_movements.end_marker');
    console.log('  - consumable_returns.segment_start');
    console.log('  - consumable_returns.segment_end');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyCableMarkersMigration().catch(console.error);
