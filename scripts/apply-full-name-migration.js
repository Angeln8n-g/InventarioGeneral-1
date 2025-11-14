/**
 * Script to apply the full_name migration to users table
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🔧 Applying full_name migration to users table...\n')

  try {
    // Check if column already exists
    console.log('1️⃣ Checking if full_name column exists...')
    const { data: columns, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (checkError) {
      console.log('   Column does not exist, will add it')
    } else if (columns && columns[0] && 'full_name' in columns[0]) {
      console.log('   ✅ Column already exists!')
      return
    }

    // Add full_name column
    console.log('\n2️⃣ Adding full_name column...')
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);'
    })

    if (addColumnError) {
      console.log('   Using alternative method...')
      // Alternative: Update via direct SQL if RPC not available
      console.log('   ⚠️  Please run this SQL manually in Supabase SQL Editor:')
      console.log('')
      console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);')
      console.log('   UPDATE users SET full_name = username WHERE full_name IS NULL;')
      console.log('')
      return
    }

    console.log('   ✅ Column added')

    // Update existing users
    console.log('\n3️⃣ Updating existing users...')
    const { data: users } = await supabase
      .from('users')
      .select('id, username')

    if (users) {
      for (const user of users) {
        await supabase
          .from('users')
          .update({ full_name: user.username })
          .eq('id', user.id)
      }
      console.log(`   ✅ Updated ${users.length} users`)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n💡 You can now use the user management system')

  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:')
    console.log('')
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);')
    console.log('UPDATE users SET full_name = username WHERE full_name IS NULL;')
    console.log('')
  }
}

applyMigration()
