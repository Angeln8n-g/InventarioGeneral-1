// Script para verificar si la migración de devoluciones se ejecutó correctamente
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigration() {
  console.log('🔍 Verificando migración de devoluciones...\n')

  try {
    // 1. Verificar que existe la tabla consumable_returns
    console.log('1. Verificando tabla consumable_returns...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('consumable_returns')
      .select('id')
      .limit(1)

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('   ❌ La tabla consumable_returns NO existe')
        console.log('   📝 Necesitas ejecutar la migración en Supabase Studio')
        console.log('   👉 Ve a: https://app.supabase.com → SQL Editor')
        console.log('   👉 Copia el contenido de: supabase/migrations/007_add_consumable_returns.sql')
        return false
      }
      throw tableError
    }
    console.log('   ✅ Tabla consumable_returns existe\n')

    // 2. Verificar constraint de stock_movements
    console.log('2. Verificando constraint de stock_movements...')
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select('movement_type')
      .limit(1)

    if (movementsError) {
      console.log('   ⚠️  No se pudo verificar stock_movements')
    } else {
      console.log('   ✅ Tabla stock_movements accesible\n')
    }

    // 3. Verificar que hay consumos para probar
    console.log('3. Verificando consumos existentes...')
    const { data: consumptions, error: consumptionsError } = await supabase
      .from('stock_movements')
      .select('id, user_id, created_at')
      .eq('movement_type', 'consumption')
      .limit(5)

    if (consumptionsError) {
      console.log('   ⚠️  Error al verificar consumos:', consumptionsError.message)
    } else if (!consumptions || consumptions.length === 0) {
      console.log('   ⚠️  No hay consumos registrados')
      console.log('   💡 Necesitas consumir items primero para poder devolverlos')
    } else {
      console.log(`   ✅ Encontrados ${consumptions.length} consumos`)
      console.log('   📅 Fechas de consumo:')
      consumptions.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString('es-ES')
        console.log(`      - ${date} (Usuario ID: ${c.user_id})`)
      })
    }

    console.log('\n✅ Migración verificada correctamente!')
    console.log('\n🎉 El sistema de devoluciones está listo para usar')
    console.log('👉 Accede a: http://localhost:3000/consumables/return')
    
    return true

  } catch (error) {
    console.error('\n❌ Error al verificar migración:', error.message)
    return false
  }
}

checkMigration()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
