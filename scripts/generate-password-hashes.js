/**
 * Script para generar hashes de contraseñas para usuarios de prueba
 * Ejecutar con: node scripts/generate-password-hashes.js
 */

const bcrypt = require('bcryptjs');

const users = [
  { username: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
  { username: 'teacher1', email: 'teacher1@example.com', password: 'password123', role: 'user' },
  { username: 'teacher2', email: 'teacher2@example.com', password: 'password123', role: 'user' },
];

async function generateHashes() {
  console.log('Generando hashes de contraseñas...\n');
  console.log('-- SQL para insertar usuarios con contraseñas hasheadas');
  console.log('-- Contraseña para todos: password123\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`-- Usuario: ${user.username} (${user.role})`);
    console.log(`INSERT INTO users (username, email, password_hash, role) VALUES`);
    console.log(`('${user.username}', '${user.email}', '${hash}', '${user.role}');`);
    console.log('');
  }
  
  console.log('\n✅ Copia y pega estos INSERT statements en tu base de datos Supabase');
  console.log('   o actualiza el archivo supabase/migrations/003_sample_data.sql');
}

generateHashes().catch(console.error);
