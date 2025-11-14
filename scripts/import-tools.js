/**
 * Script para importar herramientas desde Excel a Supabase
 * 
 * Uso:
 * node scripts/import-tools.js
 */

const XLSX = require('xlsx')
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function readExcelFile(filePath) {
  console.log('📖 Leyendo archivo Excel...')
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`)
  }

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet)
  
  console.log(`✅ Se encontraron ${data.length} registros en el Excel`)
  console.log(`📄 Hoja: ${sheetName}`)
  
  // Mostrar las columnas encontradas
  if (data.length > 0) {
    console.log(`📋 Columnas encontradas: ${Object.keys(data[0]).join(', ')}`)
  }
  
  // Mapear los datos según las columnas del Excel
  const tools = data.map((row) => ({
    nombre: row['Nombre'] || row['nombre'] || row['NOMBRE'] || row['Herramienta'] || '',
    descripcion: row['Descripción'] || row['descripcion'] || row['DESCRIPCIÓN'] || row['Descripcion'] || '',
    categoria: row['Categoría'] || row['categoria'] || row['CATEGORÍA'] || row['Categoria'] || 'General',
    codigo_qr: row['Código QR'] || row['codigo_qr'] || row['QR'] || row['Codigo QR'] || '',
    numero_serie: row['Número de Serie'] || row['numero_serie'] || row['SERIE'] || row['Serie'] || row['Numero de Serie'] || '',
    estado: row['Estado'] || row['estado'] || row['ESTADO'] || 'available',
  }))

  return tools.filter(tool => tool.nombre) // Filtrar filas vacías
}

async function createItemType(nombre, descripcion, categoria) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/item_types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: nombre,
      description: descripcion,
      category: categoria,
      is_consumable: false,
      default_loan_duration_days: 7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error creando item_type: ${error}`)
  }

  const data = await response.json()
  return data[0]
}

async function createToolInstance(itemTypeId, codigoQr, numeroSerie, estado) {
  const qrCode = codigoQr || `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const serialNumber = numeroSerie || `SN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Mapear estados del Excel a los estados válidos de la BD
  const statusMap = {
    'disponible': 'available',
    'available': 'available',
    'prestado': 'loaned',
    'loaned': 'loaned',
    'mantenimiento': 'out-of-service',
    'out-of-service': 'out-of-service',
    'perdido': 'lost',
    'lost': 'lost',
    'dañado': 'damaged',
    'damaged': 'damaged'
  }
  
  const mappedStatus = statusMap[estado?.toLowerCase()] || 'available'
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/tool_instances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      item_type_id: itemTypeId,
      qr_code: qrCode,
      serial_number: serialNumber,
      status: mappedStatus
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Error creando tool_instance: ${error}`)
  }

  const data = await response.json()
  return data[0]
}

async function importTools(tools) {
  console.log('\n🚀 Iniciando importación de herramientas...\n')

  let successCount = 0
  let errorCount = 0
  const errors = []

  // Agrupar herramientas por nombre (item_type)
  const groupedTools = new Map()
  
  for (const tool of tools) {
    const key = tool.nombre.trim().toLowerCase()
    if (!groupedTools.has(key)) {
      groupedTools.set(key, [])
    }
    groupedTools.get(key).push(tool)
  }

  console.log(`📦 Se encontraron ${groupedTools.size} tipos de herramientas diferentes\n`)

  // Procesar cada tipo de herramienta
  for (const [nombre, instances] of groupedTools) {
    try {
      console.log(`\n📝 Procesando: ${instances[0].nombre}`)
      
      // Crear el item_type
      const itemType = await createItemType(
        instances[0].nombre,
        instances[0].descripcion || '',
        instances[0].categoria || 'General'
      )
      
      console.log(`   ✅ Item type creado (ID: ${itemType.id})`)

      // Crear las instancias de herramientas
      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i]
        try {
          await createToolInstance(
            itemType.id,
            instance.codigo_qr || '',
            instance.numero_serie || '',
            instance.estado || 'available'
          )
          successCount++
          console.log(`   ✅ Instancia ${i + 1}/${instances.length} creada`)
        } catch (error) {
          errorCount++
          const errorMsg = `Error en instancia de ${instance.nombre}: ${error.message}`
          errors.push(errorMsg)
          console.log(`   ❌ ${errorMsg}`)
        }
      }

    } catch (error) {
      errorCount += instances.length
      const errorMsg = `Error procesando ${instances[0].nombre}: ${error.message}`
      errors.push(errorMsg)
      console.log(`   ❌ ${errorMsg}`)
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE IMPORTACIÓN')
  console.log('='.repeat(60))
  console.log(`✅ Herramientas importadas exitosamente: ${successCount}`)
  console.log(`❌ Errores: ${errorCount}`)
  console.log(`📦 Tipos de herramientas creados: ${groupedTools.size}`)
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERRORES ENCONTRADOS:')
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
  }
  
  console.log('='.repeat(60) + '\n')
}

async function main() {
  try {
    // Validar variables de entorno
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
    }

    console.log('🔧 Script de Importación de Herramientas')
    console.log('='.repeat(60))
    console.log(`📁 Archivo: supabase/Herramientas.xlsx`)
    console.log(`🌐 Supabase URL: ${SUPABASE_URL}`)
    console.log('='.repeat(60) + '\n')

    // Leer el archivo Excel
    const excelPath = path.join(process.cwd(), 'supabase', 'Herramientas.xlsx')
    const tools = await readExcelFile(excelPath)

    if (tools.length === 0) {
      console.log('⚠️  No se encontraron herramientas para importar')
      return
    }

    // Mostrar preview de los datos
    console.log('\n📋 Preview de los primeros 3 registros:')
    tools.slice(0, 3).forEach((tool, index) => {
      console.log(`\n${index + 1}. ${tool.nombre}`)
      console.log(`   Descripción: ${tool.descripcion || 'N/A'}`)
      console.log(`   Categoría: ${tool.categoria || 'General'}`)
      console.log(`   Código QR: ${tool.codigo_qr || 'Se generará automáticamente'}`)
      console.log(`   Número de Serie: ${tool.numero_serie || 'Se generará automáticamente'}`)
      console.log(`   Estado: ${tool.estado || 'available'}`)
    })

    // Confirmar antes de importar
    console.log('\n⚠️  La importación comenzará en 5 segundos...')
    console.log('Presiona Ctrl+C para cancelar\n')
    
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Importar herramientas
    await importTools(tools)

    console.log('✅ Importación completada!\n')

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
main()
