const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../public/images');
const outputDir = path.join(__dirname, '../public/images/optimized');

// Crear directorio de salida si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Lista de imágenes a optimizar
const imagesToOptimize = [
  'dashboard-background.jpg',
  'Devoluciones-background.jpg',
  'materiales-reservas-background.jpg',
  'Solicud de materiales.391Z.jpg',
  'solicitar-materiales-background.jpg',
  'Solicitar-herramientas-background.jpg',
  'login-background.jpg',
  'home-background.jpg',
  'Solicitar-materiales-background.jpg'
];

async function optimizeImages() {
  console.log('🖼️  Iniciando optimización de imágenes...\n');

  for (const image of imagesToOptimize) {
    const inputPath = path.join(inputDir, image);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Archivo no encontrado: ${image}`);
      continue;
    }

    const outputName = image.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const outputPath = path.join(outputDir, outputName);

    try {
      const inputStats = fs.statSync(inputPath);
      const inputSize = (inputStats.size / 1024).toFixed(2);

      await sharp(inputPath)
        .webp({ quality: 75 })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      const outputSize = (outputStats.size / 1024).toFixed(2);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

      console.log(`✅ ${image}`);
      console.log(`   ${inputSize} KB → ${outputSize} KB (${reduction}% reducción)\n`);
    } catch (error) {
      console.error(`❌ Error procesando ${image}:`, error.message);
    }
  }

  console.log('🎉 Optimización completada!');
}

optimizeImages().catch(console.error);
