/**
 * Script para generar todos los iconos de Claro en los tamaños necesarios
 * 
 * Uso:
 * 1. Coloca tu icono fuente (mínimo 1024x1024) en: public/claro-icon-source.png
 * 2. Ejecuta: node scripts/generate-claro-icons.js
 * 3. Los iconos se generarán en public/icons/
 * 
 * Requisitos:
 * npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_FILE = path.join(__dirname, '../public/claro-icon-source.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');
const CLARO_RED = { r: 227, g: 6, b: 19, alpha: 1 }; // #E30613

// Tamaños necesarios
const ICON_SIZES = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

async function generateIcons() {
  console.log('🎨 Generador de Iconos de Claro\n');

  // Verificar que existe el archivo fuente
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('❌ Error: No se encontró el archivo fuente');
    console.error(`   Coloca tu icono en: ${INPUT_FILE}`);
    console.error('   El icono debe ser PNG de al menos 1024x1024 píxeles');
    process.exit(1);
  }

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 Directorio creado: public/icons/\n');
  }

  // Obtener información del archivo fuente
  const metadata = await sharp(INPUT_FILE).metadata();
  console.log(`📷 Archivo fuente: ${metadata.width}x${metadata.height} píxeles`);
  
  if (metadata.width < 512 || metadata.height < 512) {
    console.warn('⚠️  Advertencia: El icono fuente es pequeño. Recomendado: 1024x1024 o mayor\n');
  } else {
    console.log('✅ Tamaño del archivo fuente es adecuado\n');
  }

  console.log('🔄 Generando iconos...\n');

  // Generar cada tamaño
  for (const { size, name } of ICON_SIZES) {
    try {
      await sharp(INPUT_FILE)
        .resize(size, size, {
          fit: 'contain',
          background: CLARO_RED
        })
        .png({ quality: 100 })
        .toFile(path.join(OUTPUT_DIR, name));
      
      console.log(`   ✅ ${name}`);
    } catch (error) {
      console.error(`   ❌ Error generando ${name}:`, error.message);
    }
  }

  // Generar apple-touch-icon (180x180)
  try {
    await sharp(INPUT_FILE)
      .resize(180, 180, {
        fit: 'contain',
        background: CLARO_RED
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
    
    console.log('   ✅ apple-touch-icon.png (180x180)');
  } catch (error) {
    console.error('   ❌ Error generando apple-touch-icon:', error.message);
  }

  // Generar favicon.ico (multi-size)
  try {
    // Generar versiones de 16, 32 y 48 píxeles
    const favicon16 = await sharp(INPUT_FILE)
      .resize(16, 16, { fit: 'contain', background: CLARO_RED })
      .png()
      .toBuffer();
    
    const favicon32 = await sharp(INPUT_FILE)
      .resize(32, 32, { fit: 'contain', background: CLARO_RED })
      .png()
      .toBuffer();
    
    const favicon48 = await sharp(INPUT_FILE)
      .resize(48, 48, { fit: 'contain', background: CLARO_RED })
      .png()
      .toBuffer();

    // Nota: Para crear un .ico real, necesitarías una librería adicional
    // Por ahora, guardamos el de 32x32 como favicon
    fs.writeFileSync(
      path.join(__dirname, '../public/favicon-32x32.png'),
      favicon32
    );
    
    console.log('   ✅ favicon-32x32.png');
    console.log('   ℹ️  Para favicon.ico, usa una herramienta online como:');
    console.log('      https://realfavicongenerator.net/');
  } catch (error) {
    console.error('   ❌ Error generando favicon:', error.message);
  }

  console.log('\n🎉 ¡Iconos generados exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Verifica los iconos en public/icons/');
  console.log('   2. Actualiza manifest.json (ver CLARO_ICON_INTEGRATION_GUIDE.md)');
  console.log('   3. Actualiza src/app/layout.tsx');
  console.log('   4. Genera favicon.ico en https://realfavicongenerator.net/');
  console.log('   5. Prueba la aplicación en diferentes dispositivos\n');
}

// Ejecutar
generateIcons().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
