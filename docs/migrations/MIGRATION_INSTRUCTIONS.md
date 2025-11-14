# 🚨 INSTRUCCIONES URGENTES - Aplicar Migración

## ⚠️ Error Actual

```
Could not find the table 'public.notification_preferences' in the schema cache
```

**Causa:** La tabla `notification_preferences` no existe en la base de datos.

**Solución:** Aplicar la migración SQL.

---

## 🔧 Cómo Aplicar la Migración

### Opción 1: Supabase Dashboard (Recomendado) ⭐

1. **Abre Supabase Dashboard**

   - Ve a https://app.supabase.com
   - Selecciona tu proyecto

2. **Abre SQL Editor**

   - En el menú lateral, click en "SQL Editor"
   - Click en "New query"

3. **Copia y Pega el Script**

   - Abre el archivo `APPLY_MIGRATION_NOW.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta el Script**

   - Click en "Run" (o presiona Ctrl+Enter)
   - Espera a que termine (debería tomar 1-2 segundos)

5. **Verifica el Resultado**
   - Deberías ver mensajes de éxito
   - Verifica que se crearon las preferencias

---

### Opción 2: psql (Línea de Comandos)

```bash
# Reemplaza con tus credenciales de Supabase
psql -h <your-supabase-host> \
     -U postgres \
     -d postgres \
     -f APPLY_MIGRATION_NOW.sql
```

---

### Opción 3: Copiar y Pegar Directo

Si prefieres copiar el SQL directamente, aquí está:

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
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

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
```

---

## ✅ Verificación

Después de aplicar la migración, verifica que funcionó:

```sql
-- Verificar que la tabla existe
SELECT * FROM notification_preferences LIMIT 1;

-- Contar preferencias creadas
SELECT COUNT(*) FROM notification_preferences;
```

---

## 🔄 Reiniciar el Servidor

Después de aplicar la migración:

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

---

## 🎉 Resultado Esperado

Después de aplicar la migración y reiniciar:

1. ✅ No más errores 500
2. ✅ El icono de engranaje ⚙️ funciona
3. ✅ El modal de preferencias se abre
4. ✅ Puedes guardar preferencias

---

## 🐛 Si Aún Hay Problemas

### Error: "relation already exists"

**Solución:** La tabla ya existe, todo está bien. Continúa.

### Error: "permission denied"

**Solución:** Asegúrate de estar usando el usuario correcto (postgres o service_role).

### Error: "function already exists"

**Solución:** Usa `CREATE OR REPLACE FUNCTION` (ya está en el script).

---

## 📞 Necesitas Ayuda?

1. Verifica que estás en el proyecto correcto de Supabase
2. Verifica que tienes permisos de administrador
3. Revisa los logs del SQL Editor para errores específicos

---

**Tiempo estimado:** 2-3 minutos  
**Dificultad:** Fácil  
**Prioridad:** 🚨 URGENTE (requerido para que funcione)
