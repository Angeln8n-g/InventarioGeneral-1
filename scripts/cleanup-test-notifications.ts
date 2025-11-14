#!/usr/bin/env ts-node
/**
 * Script to clean up test notifications from the database
 * Usage: npx ts-node scripts/cleanup-test-notifications.ts
 * 
 * Make sure to set these environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupTestNotifications() {
  console.log('🧹 Starting cleanup of test notifications...\n')

  try {
    // Get count before deletion
    const { count: beforeCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    console.log(`📊 Total notifications before cleanup: ${beforeCount}`)

    // Delete notifications with test-related content
    const { data: deleted, error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .or('title.ilike.%test%,message.ilike.%test%,title.ilike.%prueba%,message.ilike.%prueba%')
      .select()

    if (deleteError) throw deleteError

    console.log(`✅ Deleted ${deleted?.length || 0} test notifications`)

    // Get count after deletion
    const { count: afterCount, error: afterCountError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })

    if (afterCountError) throw afterCountError

    console.log(`📊 Total notifications after cleanup: ${afterCount}`)
    console.log('\n✨ Cleanup completed successfully!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupTestNotifications()
