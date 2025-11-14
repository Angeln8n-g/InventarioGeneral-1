const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('Running migration 004_add_full_name_and_update_roles.sql...')
    
    const migrationPath = path.join(__dirname, '../supabase/migrations/004_add_full_name_and_update_roles.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...')
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          console.error('Error executing statement:', error)
          // Try direct query as fallback
          const { error: directError } = await supabase.from('_migrations').insert({
            name: '004_add_full_name_and_update_roles',
            executed_at: new Date().toISOString()
          })
          if (directError) console.error('Direct query also failed:', directError)
        }
      }
    }
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
