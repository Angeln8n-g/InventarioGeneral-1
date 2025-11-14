/**
 * Script para convertir imágenes JPG a WebP
 * Usa Sharp para conversión de alta calidad
 * 
 * Uso: node scripts/convert-images-to-webp.js
 */

const sharp = require('sharp')
const fs = require('fs').promises
const path = require('path')

const INPUT_DIR = 'public/images'
const QUALITY = 85

async function convertToWebP() {
  console.log('🖼️  Iniciando conversión de imágenes a WebP...\n')

  try {
    // Leer archivos del directorio
    const files = await fs.readdir(INPUT_DIR)
    const jpgFiles = files.filter(file => file.toLowerCase().endsWith('.jpg'))

    if (jpgFiles.length === 0) {
      console.log('⚠️  No se encontraron archivos JPG para convertir')
      return
    }

    console.log(`📁 Encontrados ${jpgFiles.length} archivos JPG\n`)

    let totalOriginalSize = 0
    let totalWebPSize = 0
    const results = []

    // Convertir cada archivo
    for (const file of jpgFiles) {
      const inputPath = path.join(INPUT_DIR, file)
      const outputPath = inputPath.replace(/\.jpg$/i, '.webp')

      try {
        // Obtener tamaño original
        const originalStats = await fs.stat(inputPath)
        const originalSize = originalStats.size

        // Convertir a WebP
        await sharp(inputPath)
          .webp({ quality: QUALITY })
          .toFile(outputPath)

        // Obtener tamaño nuevo
        const webpStats = await fs.stat(outputPath)
        const webpSize = webpStats.size

        // Calcular reducción
        const reduction = ((originalSize - webpSize) / originalSize * 100).toFixed(1)

        totalOriginalSize += originalSize
        totalWebPSize += webpSize

        results.push({
          file,
          originalSize: (originalSize / 1024).toFixed(2),
          webpSize: (webpSize / 1024).toFixed(2),
          reduction,
        })

        console.log(`✅ ${file}`)
        console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`)
        console.log(`   WebP: ${(webpSize / 1024).toFixed(2)} KB`)
        console.log(`   Reducción: ${reduction}%\n`)

      } catch (error) {
        console.error(`❌ Error convirtiendo ${file}:`, error.message)
      }
    }

    // Resumen final
    console.log('━'.repeat(50))
    console.log('📊 RESUMEN FINAL\n')
    console.log(`Total archivos convertidos: ${results.length}`)
    console.log(`Tamaño original total: ${(totalOriginalSize / 1024).toFixed(2)} KB`)
    console.log(`Tamaño WebP total: ${(totalWebPSize / 1024).toFixed(2)} KB`)
    console.log(`Reducción total: ${((totalOriginalSize - totalWebPSize) / totalOriginalSize * 100).toFixed(1)}%`)
    console.log(`Ahorro: ${((totalOriginalSize - totalWebPSize) / 1024).toFixed(2)} KB`)
    console.log('━'.repeat(50))

    console.log('\n🎉 Conversión completada exitosamente!')
    console.log('\n📝 Próximos pasos:')
    console.log('1. Actualizar referencias en el código')
    console.log('2. Probar en desarrollo')
    console.log('3. Mantener JPG como fallback')

  } catch (error) {
    console.error('❌ Error durante la conversión:', error)
    process.exit(1)
  }
}

// Ejecutar conversión
convertToWebP()
