// Script para corregir movimientos de stock existentes y crear los faltantes
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStockMovements() {
  console.log('🔧 Corrigiendo movimientos de stock...\n')

  try {
    // 1. Corregir movimientos existentes con cantidad positiva
    console.log('1. Corrigiendo movimientos de consumo con cantidad positiva...')
    const { data: positiveMovements, error: fetchError } = await supabase
      .from('stock_movements')
      .select('id, quantity, movement_type')
      .eq('movement_type', 'consumption')
      .gt('quantity', 0)

    if (fetchError) {
      console.error('   ❌ Error al buscar movimientos:', fetchError.message)
    } else if (positiveMovements && positiveMovements.length > 0) {
      console.log(`   📊 Encontrados ${positiveMovements.length} movimientos a corregir`)
      
      for (const movement of positiveMovements) {
        const { error: updateError } = await supabase
          .from('stock_movements')
          .update({ quantity: -Math.abs(movement.quantity) })
          .eq('id', movement.id)

        if (updateError) {
          console.error(`   ❌ Error al actualizar movimiento ${movement.id}:`, updateError.message)
        }
      }
      
      console.log(`   ✅ Corregidos ${positiveMovements.length} movimientos\n`)
    } else {
      console.log('   ✅ No hay movimientos que corregir\n')
    }

    // 2. Crear movimientos faltantes para solicitudes cumplidas
    console.log('2. Creando movimientos faltantes para solicitudes cumplidas...')
    
    // Obtener solicitudes cumplidas que no tienen movimiento de stock
    const { data: fulfilledRequests, error: requestsError } = await supabase
      .from('consumable_requests')
      .select(`
        id,
        user_id,
        item_type_id,
        fulfilled_quantity,
        fulfilled_at,
        consumable_stock:consumable_stock!inner(id)
      `)
      .eq('status', 'fulfilled')
      .not('fulfilled_at', 'is', null)
      .order('fulfilled_at', { ascending: false })

    if (requestsError) {
      console.error('   ❌ Error al buscar solicitudes:', requestsError.message)
    } else if (fulfilledRequests && fulfilledRequests.length > 0) {
      console.log(`   📊 Encontradas ${fulfilledRequests.length} solicitudes cumplidas`)
      
      let created = 0
      let skipped = 0

      for (const request of fulfilledRequests) {
        // Verificar si ya existe un movimiento para esta solicitud
        const { data: existingMovement } = await supabase
          .from('stock_movements')
          .select('id')
          .eq('consumable_stock_id', request.consumable_stock.id)
          .eq('user_id', request.user_id)
          .eq('movement_type', 'consumption')
          .gte('created_at', new Date(request.fulfilled_at).toISOString())
          .lte('created_at', new Date(new Date(request.fulfilled_at).getTime() + 60000).toISOString()) // +1 minuto
          .single()

        if (existingMovement) {
          skipped++
          continue
        }

        // Crear movimiento de stock
        const { error: insertError } = await supabase
          .from('stock_movements')
          .insert({
            consumable_stock_id: request.consumable_stock.id,
            movement_type: 'consumption',
            quantity: -request.fulfilled_quantity,
            user_id: request.user_id,
            notes: `Consumable request fulfilled - Request ID: ${request.id} (retroactive)`,
            created_at: request.fulfilled_at,
          })

        if (insertError) {
          console.error(`   ❌ Error al crear movimiento para solicitud ${request.id}:`, insertError.message)
        } else {
          created++
        }
      }

      console.log(`   ✅ Creados ${created} movimientos nuevos`)
      console.log(`   ⏭️  Omitidos ${skipped} (ya existían)\n`)
    } else {
      console.log('   ℹ️  No hay solicitudes cumplidas\n')
    }

    // 3. Verificar resultado
    console.log('3. Verificando resultado...')
    const { data: allMovements, error: verifyError } = await supabase
      .from('stock_movements')
      .select('id, movement_type, quantity, created_at')
      .eq('movement_type', 'consumption')
      .order('created_at', { ascending: false })
      .limit(10)

    if (verifyError) {
      console.error('   ❌ Error al verificar:', verifyError.message)
    } else if (allMovements) {
      console.log(`   ✅ Total de movimientos de consumo: ${allMovements.length}`)
      console.log('   📋 Últimos 10 movimientos:')
      allMovements.forEach(m => {
        const date = new Date(m.created_at).toLocaleDateString('es-ES')
        const qty = m.quantity
        console.log(`      - ${date}: ${qty} (${qty < 0 ? '✅ Correcto' : '⚠️ Revisar'})`)
      })
    }

    console.log('\n✅ Proceso completado!')
    console.log('👉 Ahora intenta acceder a: http://localhost:3000/consumables/return')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  }
}

fixStockMovements()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
