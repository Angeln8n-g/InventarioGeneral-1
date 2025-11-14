/**
 * Script to list all users in the database
 * Helps debug user management issues
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listUsers() {
  console.log('📋 Listing all users in database...\n')

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, full_name, created_at')
      .order('id', { ascending: true })

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database')
      return
    }

    console.log(`✅ Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`)
      console.log(`   Username: ${user.username}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Full Name: ${user.full_name || '(not set)'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log('')
    })

    console.log('💡 To edit a user, visit:')
    users.forEach((user) => {
      console.log(`   http://localhost:3000/admin/users/${user.id}`)
    })

  } catch (error) {
    console.error('❌ Error listing users:', error.message)
    process.exit(1)
  }
}

listUsers()
