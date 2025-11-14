# 🚨 SOLUCIÓN RÁPIDA - Error 500

## ❌ Error que Estás Viendo

```
Could not find the table 'public.notification_preferences' in the schema cache
GET /api/notifications/preferences 500
PUT /api/notifications/preferences 500
```

---

## ✅ Solución (2 minutos)

### Paso 1: Abre Supabase Dashboard

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Click en "SQL Editor" en el menú lateral

### Paso 2: Ejecuta Este SQL

Copia y pega esto en el SQL Editor:

```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_confirmation BOOLEAN DEFAULT true,
  return_confirmation BOOLEAN DEFAULT true,
  loan_reminder BOOLEAN DEFAULT true,
  overdue_notice BOOLEAN DEFAULT true,
  consumable_fulfilled BOOLEAN DEFAULT true,
  consumable_backorder BOOLEAN DEFAULT true,
  system_announcement BOOLEAN DEFAULT true,
  stock_alert BOOLEAN DEFAULT true,
  system_maintenance BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Deshabilitar RLS
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
ON notification_preferences(user_id);

-- Insertar preferencias para usuarios existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Crear función
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON users;
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- Verificar
SELECT 'Migración completada exitosamente!' as status;
SELECT COUNT(*) as total_preferencias FROM notification_preferences;
```

### Paso 3: Click en "Run"

Presiona el botón "Run" o Ctrl+Enter

### Paso 4: Verifica el Resultado

Deberías ver:
```
status: "Migración completada exitosamente!"
total_preferencias: 3 (o el número de usuarios que tengas)
```

### Paso 5: Reinicia el Servidor

```bash
# Detén el servidor (Ctrl+C en la terminal)
# Reinicia
npm run dev
```

---

## ✅ Resultado

Después de estos pasos:

1. ✅ No más errores 500
2. ✅ El icono de engranaje ⚙️ funciona
3. ✅ Puedes abrir preferencias
4. ✅ Puedes guardar cambios

---

## 🎯 Verificación Final

Prueba esto en tu navegador:

1. Inicia sesión
2. Click en el icono de campana 🔔
3. Click en el icono de engranaje ⚙️
4. Deberías ver el modal de preferencias
5. Cambia alguna preferencia
6. Click en "Guardar Cambios"
7. Deberías ver un mensaje de éxito

---

## 🐛 Si Aún Hay Problemas

### Error: "relation already exists"
✅ Perfecto, la tabla ya existe. Continúa al Paso 5.

### Error: "permission denied"
❌ Asegúrate de estar usando el usuario correcto en Supabase.

### Aún ves error 500
1. Verifica que ejecutaste TODO el SQL
2. Reinicia el servidor de desarrollo
3. Limpia el cache del navegador (Ctrl+Shift+R)

---

## 📞 Más Ayuda

Si necesitas más detalles, revisa:
- `MIGRATION_INSTRUCTIONS.md` - Instrucciones detalladas
- `APPLY_MIGRATION_NOW.sql` - Script completo
- `START_HERE.md` - Guía completa

---

**Tiempo total:** 2-3 minutos  
**Dificultad:** Muy fácil  
**Éxito garantizado:** ✅
