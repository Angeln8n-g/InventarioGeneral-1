require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateQRCodes() {
  console.log('🔄 Generating unique QR codes for consumables...\n')
  
  try {
    // Fetch all consumables
    const { data: consumables, error: fetchError } = await supabase
      .from('consumable_stock')
      .select('id, qr_code, item_type:item_types(name)')
    
    if (fetchError) {
      console.error('❌ Error fetching consumables:', fetchError)
      return
    }
    
    if (!consumables || consumables.length === 0) {
      console.log('ℹ️  No consumables found')
      return
    }
    
    console.log(`📦 Found ${consumables.length} consumables\n`)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    // Update each consumable with a unique QR code
    for (const consumable of consumables) {
      const itemName = consumable.item_type?.name || 'Unknown'
      
      if (!consumable.qr_code) {
        // Generate unique QR code: CONSUMABLE-{ID}-{TIMESTAMP}
        const timestamp = Date.now()
        const uniqueQR = `CONSUMABLE-${consumable.id}-${timestamp}`
        
        const { error: updateError } = await supabase
          .from('consumable_stock')
          .update({ qr_code: uniqueQR })
          .eq('id', consumable.id)
        
        if (updateError) {
          console.error(`❌ Error updating consumable ${consumable.id} (${itemName}):`, updateError.message)
          errors++
        } else {
          console.log(`✅ Generated QR for ID ${consumable.id} (${itemName}): ${uniqueQR}`)
          updated++
        }
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      } else {
        console.log(`⏭️  Skipped ID ${consumable.id} (${itemName}) - already has QR code`)
        skipped++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('='.repeat(60))
    
    if (updated > 0) {
      console.log('\n✨ QR codes generated successfully!')
      
      // Show sample of updated records
      const { data: sample } = await supabase
        .from('consumable_stock')
        .select('id, qr_code, item_type:item_types(name)')
        .not('qr_code', 'is', null)
        .limit(3)
      
      if (sample && sample.length > 0) {
        console.log('\n📋 Sample records:')
        sample.forEach(item => {
          console.log(`   • ${item.item_type?.name}: ${item.qr_code}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

generateQRCodes()
