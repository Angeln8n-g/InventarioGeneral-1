require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createStockMovementsTable() {
  console.log('🔄 Creating stock_movements table...\n')
  
  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('stock_movements')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ Table stock_movements already exists')
      
      // Show sample data
      const { data: sample } = await supabase
        .from('stock_movements')
        .select('*')
        .limit(3)
      
      if (sample && sample.length > 0) {
        console.log('\n📋 Sample records:')
        sample.forEach(record => {
          console.log(`  • ID: ${record.id}, Type: ${record.movement_type}, Quantity: ${record.quantity}`)
        })
      } else {
        console.log('\nℹ️  Table is empty (no movements recorded yet)')
      }
      
      return
    }
    
    console.log('📝 Table does not exist. You need to run the SQL migration in Supabase.')
    console.log('\n' + '='.repeat(60))
    console.log('INSTRUCTIONS:')
    console.log('='.repeat(60))
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the following SQL:\n')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '006_add_stock_movements.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('--- SQL START ---')
    console.log(migrationSQL)
    console.log('--- SQL END ---\n')
    
    console.log('4. Click "Run" to execute the SQL')
    console.log('5. Run this script again to verify')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createStockMovementsTable()
