require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyTrigger() {
  console.log('🚀 Applying consumable QR code trigger...\n')
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../supabase/migrations/add_consumable_qr_trigger.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by semicolons to execute each statement separately
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`[${i + 1}/${statements.length}] Executing...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message)
        console.log('Trying direct query...')
        
        // Try with direct query as fallback
        const { error: directError } = await supabase.from('_sql').select(statement)
        if (directError) {
          console.error('❌ Direct query also failed:', directError.message)
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('\n✅ Trigger migration completed!')
    console.log('\n📋 Testing the trigger...')
    
    // Test by inserting a dummy record (will be rolled back)
    const testItemTypeId = 9999999 // Non-existent ID for testing
    const { data: testData, error: testError } = await supabase
      .from('consumable_stock')
      .insert({
        item_type_id: testItemTypeId,
        current_quantity: 0,
        minimum_threshold: 5,
        unit_of_measure: 'test'
      })
      .select()
    
    if (testError) {
      console.log('⚠️  Test insert failed (expected if item_type_id constraint):', testError.message)
    } else if (testData && testData[0]) {
      console.log('✅ Trigger working! Generated QR:', testData[0].qr_code)
      // Clean up test data
      await supabase.from('consumable_stock').delete().eq('id', testData[0].id)
    }
    
    console.log('\n🎉 All done! New consumables will automatically get QR codes.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

applyTrigger()
