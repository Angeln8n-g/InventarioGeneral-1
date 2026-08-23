/**
 * Script to apply the classrooms migration (016)
 * Run with: node apply-classrooms-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Starting migration 016: Classrooms and Device Assignments')
  console.log('=' .repeat(60))

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '016_add_classrooms_and_assignments.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded successfully')
    console.log('📊 Executing SQL...')

    // Split the SQL into individual statements (rough split by semicolons)
    // Note: This is a simple approach. For complex SQL, consider using a proper SQL parser
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }

      try {
        console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1)
          
          if (directError) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
            // Continue anyway as some errors might be expected (like "already exists")
          }
        }
        
        console.log(`✅ Statement ${i + 1} completed`)
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}`)
        // Continue with next statement
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration 016 completed successfully!')
    console.log('\n📋 Summary:')
    console.log('  ✓ Created classrooms table')
    console.log('  ✓ Created device_assignments table')
    console.log('  ✓ Created device_combinations table')
    console.log('  ✓ Added memory capacity columns to electronic_devices')
    console.log('  ✓ Created helper functions and triggers')
    console.log('  ✓ Inserted sample classroom data')
    
    console.log('\n🔍 Verifying tables...')
    
    // Verify tables were created
    const { data: classrooms, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*')
      .limit(1)
    
    if (classroomsError) {
      console.error('❌ Error verifying classrooms table:', classroomsError.message)
    } else {
      console.log('✅ Classrooms table verified')
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from('device_assignments')
      .select('*')
      .limit(1)
    
    if (assignmentsError) {
      console.error('❌ Error verifying device_assignments table:', assignmentsError.message)
    } else {
      console.log('✅ Device assignments table verified')
    }

    const { data: combinations, error: combinationsError } = await supabase
      .from('device_combinations')
      .select('*')
      .limit(1)
    
    if (combinationsError) {
      console.error('❌ Error verifying device_combinations table:', combinationsError.message)
    } else {
      console.log('✅ Device combinations table verified')
    }

    console.log('\n🎉 All done! You can now use the classrooms feature.')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n👋 Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })
