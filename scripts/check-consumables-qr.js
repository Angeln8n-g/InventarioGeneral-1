require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConsumables() {
  console.log('Checking consumable QR codes...\n')
  
  const { data, error } = await supabase
    .from('consumable_stock')
    .select('id, qr_code, current_quantity, item_type:item_types(name)')
    .limit(10)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Sample consumables:')
  data.forEach(item => {
    console.log(`ID: ${item.id}`)
    console.log(`Name: ${item.item_type?.name || 'N/A'}`)
    console.log(`QR Code: ${item.qr_code || 'MISSING'}`)
    console.log(`Quantity: ${item.current_quantity}`)
    console.log('---')
  })
  
  const withoutQR = data.filter(item => !item.qr_code)
  console.log(`\nTotal checked: ${data.length}`)
  console.log(`Without QR code: ${withoutQR.length}`)
}

checkConsumables()
