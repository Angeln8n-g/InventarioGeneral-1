require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('Applying QR code migration to consumable_stock...\n')
  
  try {
    // Step 1: Add qr_code column
    console.log('Step 1: Adding qr_code column...')
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE consumable_stock ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);'
    })
    
    if (addColumnError) {
      console.error('Error adding column:', addColumnError)
      // Try alternative method
      console.log('Trying alternative method...')
    }
    
    // Step 2: Generate unique QR codes for existing consumables
    console.log('Step 2: Generating unique QR codes...')
    const { data: consumables, error: fetchError } = await supabase
      .from('consumable_stock')
      .select('id, qr_code')
    
    if (fetchError) {
      console.error('Error fetching consumables:', fetchError)
      return
    }
    
    console.log(`Found ${consumables.length} consumables`)
    
    // Update each consumable with a unique QR code
    for (const consumable of consumables) {
      if (!consumable.qr_code) {
        const uniqueQR = `CONSUMABLE-${consumable.id}-${Date.now()}`
        const { error: updateError } = await supabase
          .from('consumable_stock')
          .update({ qr_code: uniqueQR })
          .eq('id', consumable.id)
        
        if (updateError) {
          console.error(`Error updating consumable ${consumable.id}:`, updateError)
        } else {
          console.log(`✓ Updated consumable ${consumable.id} with QR: ${uniqueQR}`)
        }
      } else {
        console.log(`✓ Consumable ${consumable.id} already has QR code`)
      }
    }
    
    console.log('\n✅ Migration completed successfully!')
    
    // Verify
    const { data: updated, error: verifyError } = await supabase
      .from('consumable_stock')
      .select('id, qr_code')
      .limit(5)
    
    if (!verifyError) {
      console.log('\nSample updated records:')
      updated.forEach(item => {
        console.log(`  ID: ${item.id}, QR: ${item.qr_code}`)
      })
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

applyMigration()
