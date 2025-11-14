#!/usr/bin/env node

/**
 * Script para verificar que todas las imágenes necesarias existen
 */

const fs = require('fs')
const path = require('path')

console.log('🖼️  Verificando imágenes del proyecto...\n')

const requiredImages = [
  'public/images/Solicitar-materiales-background.jpg',
  'public/images/materiales-reservas-background.jpg',
]

let allImagesExist = true
let missingImages = []

console.log('📋 Imágenes requeridas:\n')

requiredImages.forEach((imagePath) => {
  const fullPath = path.join(process.cwd(), imagePath)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    const stats = fs.statSync(fullPath)
    const sizeInKB = (stats.size / 1024).toFixed(2)
    console.log(`✅ ${imagePath}`)
    console.log(`   Tamaño: ${sizeInKB} KB`)
    console.log(`   Permisos: ${(stats.mode & parseInt('777', 8)).toString(8)}`)
  } else {
    console.log(`❌ ${imagePath} - NO ENCONTRADA`)
    allImagesExist = false
    missingImages.push(imagePath)
  }
  console.log()
})

// Verificar directorio public/images
const imagesDir = path.join(process.cwd(), 'public/images')
if (fs.existsSync(imagesDir)) {
  console.log('📁 Contenido de public/images:')
  const files = fs.readdirSync(imagesDir)
  files.forEach(file => {
    const filePath = path.join(imagesDir, file)
    const stats = fs.statSync(filePath)
    const sizeInKB = (stats.size / 1024).toFixed(2)
    console.log(`   - ${file} (${sizeInKB} KB)`)
  })
  console.log()
} else {
  console.log('❌ El directorio public/images no existe\n')
  allImagesExist = false
}

console.log('='.repeat(60))

if (allImagesExist) {
  console.log('\n✅ TODAS LAS IMÁGENES ESTÁN PRESENTES')
  console.log('\nSi las imágenes no cargan en producción:')
  console.log('1. Verifica que se subieron al servidor')
  console.log('2. Verifica los permisos (chmod 644)')
  console.log('3. Verifica que el build se completó correctamente')
  console.log('4. Accede directamente: http://tu-servidor/images/nombre-imagen.jpg')
  process.exit(0)
} else {
  console.log('\n❌ FALTAN IMÁGENES')
  console.log('\nImágenes faltantes:')
  missingImages.forEach(img => console.log(`   - ${img}`))
  console.log('\nPara agregar las imágenes:')
  console.log('1. Colócalas en la carpeta public/images/')
  console.log('2. Asegúrate de que los nombres coincidan exactamente')
  console.log('3. Ejecuta este script nuevamente para verificar')
  console.log('\nPara subir al servidor:')
  console.log('   scp -r public/images/* root@servidor:/ruta/proyecto/public/images/')
  process.exit(1)
}
