-- ============================================
-- ACTUALIZAR PASSWORDS CON HASH REAL
-- Ejecuta este script en Supabase SQL Editor
-- ============================================

-- Password para todos los usuarios: password123
-- Hash generado con bcrypt (10 rounds)

UPDATE users SET password_hash = '$2b$10$RqKqVLCRz8ZrIlw9Q2pdX.l.89lm72dx6TBBA3ixMlTOPzaKfMTJy' WHERE username = 'admin';
UPDATE users SET password_hash = '$2b$10$RqKqVLCRz8ZrIlw9Q2pdX.l.89lm72dx6TBBA3ixMlTOPzaKfMTJy' WHERE username = 'teacher1';
UPDATE users SET password_hash = '$2b$10$RqKqVLCRz8ZrIlw9Q2pdX.l.89lm72dx6TBBA3ixMlTOPzaKfMTJy' WHERE username = 'teacher2';

-- Verificar que se actualizaron
SELECT username, email, role, 
       CASE 
         WHEN password_hash = '$2b$10$RqKqVLCRz8ZrIlw9Q2pdX.l.89lm72dx6TBBA3ixMlTOPzaKfMTJy' 
         THEN '✓ Hash actualizado' 
         ELSE '✗ Hash antiguo' 
       END as status
FROM users
ORDER BY id;
