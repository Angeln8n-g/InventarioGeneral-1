#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * 
 * Este script analiza el tamaño del bundle de Next.js y muestra
 * estadísticas sobre lazy loading y code splitting.
 */

const fs = require('fs')
const path = require('path')

const NEXT_DIR = path.join(process.cwd(), '.next')
const BUILD_MANIFEST = path.join(NEXT_DIR, 'build-manifest.json')

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function analyzeBundle() {
  console.log('\n🔍 Analizando Bundle de Next.js...\n')

  // Verificar si existe el build
  if (!fs.existsSync(NEXT_DIR)) {
    console.error('❌ Error: No se encontró el directorio .next')
    console.log('   Ejecuta "npm run build" primero\n')
    process.exit(1)
  }

  if (!fs.existsSync(BUILD_MANIFEST)) {
    console.error('❌ Error: No se encontró build-manifest.json')
    console.log('   Ejecuta "npm run build" primero\n')
    process.exit(1)
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'))
    
    // Analizar páginas
    const pages = manifest.pages || {}
    const pageStats = []
    let totalSize = 0

    for (const [page, files] of Object.entries(pages)) {
      let pageSize = 0
      
      files.forEach(file => {
        const filePath = path.join(NEXT_DIR, file)
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          pageSize += stats.size
        }
      })

      pageStats.push({
        page,
        size: pageSize,
        files: files.length
      })

      totalSize += pageSize
    }

    // Ordenar por tamaño
    pageStats.sort((a, b) => b.size - a.size)

    // Mostrar resultados
    console.log('📊 Estadísticas del Bundle\n')
    console.log('═'.repeat(70))
    console.log(`${'Página'.padEnd(40)} ${'Tamaño'.padStart(12)} ${'Archivos'.padStart(10)}`)
    console.log('═'.repeat(70))

    pageStats.slice(0, 10).forEach(stat => {
      const pageName = stat.page.length > 38 ? stat.page.substring(0, 35) + '...' : stat.page
      console.log(
        `${pageName.padEnd(40)} ${formatBytes(stat.size).padStart(12)} ${stat.files.toString().padStart(10)}`
      )
    })

    console.log('═'.repeat(70))
    console.log(`${'TOTAL'.padEnd(40)} ${formatBytes(totalSize).padStart(12)} ${pageStats.reduce((sum, s) => sum + s.files, 0).toString().padStart(10)}`)
    console.log('═'.repeat(70))

    // Análisis de lazy loading
    console.log('\n🚀 Análisis de Lazy Loading\n')
    
    const lazyChunks = pageStats.filter(p => 
      p.page.includes('lazy') || 
      p.page.includes('chunk') ||
      p.page.includes('_app') === false
    )

    console.log(`✅ Chunks lazy detectados: ${lazyChunks.length}`)
    console.log(`📦 Total de páginas: ${pageStats.length}`)
    console.log(`📊 Ratio de lazy loading: ${Math.round((lazyChunks.length / pageStats.length) * 100)}%`)

    // Recomendaciones
    console.log('\n💡 Recomendaciones\n')

    const largePagesCount = pageStats.filter(p => p.size > 500000).length
    if (largePagesCount > 0) {
      console.log(`⚠️  ${largePagesCount} página(s) > 500KB - Considera aplicar lazy loading`)
    }

    const avgSize = totalSize / pageStats.length
    if (avgSize > 200000) {
      console.log(`⚠️  Tamaño promedio por página: ${formatBytes(avgSize)} - Considera code splitting`)
    }

    if (lazyChunks.length < pageStats.length * 0.3) {
      console.log(`⚠️  Bajo uso de lazy loading (${Math.round((lazyChunks.length / pageStats.length) * 100)}%) - Revisa GUIA_LAZY_LOADING.md`)
    }

    if (largePagesCount === 0 && avgSize < 200000) {
      console.log('✅ Bundle optimizado correctamente')
    }

    console.log('\n📚 Para más información, revisa:')
    console.log('   - GUIA_LAZY_LOADING.md')
    console.log('   - EJEMPLO_LAZY_LOADING_APLICADO.md')
    console.log('')

  } catch (error) {
    console.error('❌ Error al analizar el bundle:', error.message)
    process.exit(1)
  }
}

// Ejecutar análisis
analyzeBundle()
