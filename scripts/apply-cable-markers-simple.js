const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function applyCableMarkersMigration() {
  console.log('🚀 Applying cable markers migration...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '015_add_cable_markers.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found: 015_add_cable_markers.sql');
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Executing migration SQL...\n');
  
  try {
    await executeSQL(sql);
    
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
    console.error('\nTry applying the migration manually using the Supabase SQL Editor:');
    console.error(`1. Go to ${supabaseUrl.replace('https://', 'https://app.')}/project/${projectRef}/sql`);
    console.error('2. Copy the contents of supabase/migrations/015_add_cable_markers.sql');
    console.error('3. Paste and run the SQL in the editor');
    process.exit(1);
  }
}

applyCableMarkersMigration().catch(console.error);
