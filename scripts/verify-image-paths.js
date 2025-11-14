#!/usr/bin/env node

/**
 * Script para verificar que todas las rutas de imágenes en el código
 * coincidan con los archivos reales en public/images
 */

const fs = require('fs');
const path = require('path');

// Imágenes que deben existir según src/types/images.ts
const requiredImages = [
    'login-background.jpg',
    'Solicitar-herramientas-background.jpg',
    'Devoluciones-background.jpg',
    'solicitar-materiales-background.jpg',
];

console.log('🔍 Verificando rutas de imágenes...\n');

let allValid = true;

requiredImages.forEach(imageName => {
    const imagePath = path.join(process.cwd(), 'public', 'images', imageName);
    const exists = fs.existsSync(imagePath);

    if (exists) {
        const stats = fs.statSync(imagePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ ${imageName} (${sizeKB} KB)`);
    } else {
        console.log(`❌ ${imageName} - NO ENCONTRADA`);
        allValid = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
    console.log('✅ Todas las imágenes están presentes');
    process.exit(0);
} else {
    console.log('❌ Faltan algunas imágenes');
    console.log('\n💡 Nota: Los nombres de archivo son case-sensitive en Linux');
    process.exit(1);
}
