// Script para verificar datos de devoluciones en la base de datos
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReturnsData() {
  console.log('🔍 Verificando datos de devoluciones...\n')

  try {
    // 1. Verificar devoluciones totales
    console.log('1. Verificando devoluciones en la base de datos...')
    const { data: allReturns, error: allReturnsError, count: totalCount } = await supabase
      .from('consumable_returns')
      .select('*', { count: 'exact' })
      .eq('status', 'completed')

    if (allReturnsError) {
      console.error('   ❌ Error:', allReturnsError.message)
    } else {
      console.log(`   ✅ Total de devoluciones: ${totalCount}`)
      
      if (allReturns && allReturns.length > 0) {
        const totalItems = allReturns.reduce((sum, r) => sum + r.returned_quantity, 0)
        console.log(`   ✅ Total de items devueltos: ${totalItems}`)
        
        console.log('\n   📋 Últimas 5 devoluciones:')
        allReturns.slice(0, 5).forEach(r => {
          const date = new Date(r.return_date).toLocaleDateString('es-ES')
          console.log(`      - ${date}: ${r.returned_quantity} items (Usuario: ${r.user_id})`)
        })
      } else {
        console.log('   ⚠️  No hay devoluciones registradas')
      }
    }

    // 2. Verificar devoluciones por rango de fechas (últimos 30 días)
    console.log('\n2. Verificando devoluciones de los últimos 30 días...')
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0] + 'T00:00:00'
    const endDate = new Date().toISOString().split('T')[0] + 'T23:59:59'

    const { data: recentReturns, error: recentError, count: recentCount } = await supabase
      .from('consumable_returns')
      .select('returned_quantity', { count: 'exact' })
      .eq('status', 'completed')
      .gte('return_date', startDate)
      .lte('return_date', endDate)

    if (recentError) {
      console.error('   ❌ Error:', recentError.message)
    } else {
      console.log(`   ✅ Devoluciones en últimos 30 días: ${recentCount}`)
      
      if (recentReturns && recentReturns.length > 0) {
        const recentItems = recentReturns.reduce((sum, r) => sum + r.returned_quantity, 0)
        console.log(`   ✅ Items devueltos en últimos 30 días: ${recentItems}`)
      }
    }

    // 3. Verificar consumos para comparar
    console.log('\n3. Verificando consumos de los últimos 30 días...')
    const { data: consumptions, error: consumptionError } = await supabase
      .from('stock_movements')
      .select('quantity')
      .eq('movement_type', 'consumption')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (consumptionError) {
      console.error('   ❌ Error:', consumptionError.message)
    } else if (consumptions) {
      const totalConsumed = consumptions.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
      console.log(`   ✅ Total consumido en últimos 30 días: ${totalConsumed}`)
      
      if (recentReturns && recentReturns.length > 0) {
        const recentItems = recentReturns.reduce((sum, r) => sum + r.returned_quantity, 0)
        const returnRate = ((recentItems / totalConsumed) * 100).toFixed(2)
        console.log(`   📊 Tasa de devolución: ${returnRate}%`)
      }
    }

    // 4. Verificar fechas de devoluciones
    console.log('\n4. Verificando distribución de fechas...')
    const { data: dateDistribution, error: dateError } = await supabase
      .from('consumable_returns')
      .select('return_date')
      .eq('status', 'completed')
      .order('return_date', { ascending: false })
      .limit(10)

    if (dateError) {
      console.error('   ❌ Error:', dateError.message)
    } else if (dateDistribution && dateDistribution.length > 0) {
      console.log('   📅 Fechas de devoluciones recientes:')
      dateDistribution.forEach(d => {
        const date = new Date(d.return_date)
        console.log(`      - ${date.toLocaleString('es-ES')}`)
      })
    }

    console.log('\n✅ Verificación completada!')
    console.log('\n💡 Si las métricas muestran 0, verifica:')
    console.log('   1. Que el rango de fechas incluya las devoluciones')
    console.log('   2. Que las devoluciones tengan status "completed"')
    console.log('   3. Que las fechas estén en formato correcto')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    throw error
  }
}

checkReturnsData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
