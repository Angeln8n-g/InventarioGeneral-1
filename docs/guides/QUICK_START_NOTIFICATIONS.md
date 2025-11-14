# 🚀 Inicio Rápido - Mejoras de Notificaciones

## Pasos para Activar las Nuevas Funcionalidades

### 1️⃣ Aplicar Migración de Base de Datos (REQUERIDO)

```bash
# Opción A: Usando psql
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/20250106_notification_preferences.sql

# Opción B: Desde Supabase Dashboard
# 1. Ir a SQL Editor en Supabase Dashboard
# 2. Copiar el contenido de supabase/migrations/20250106_notification_preferences.sql
# 3. Ejecutar
```

### 2️⃣ Limpiar Notificaciones de Prueba (OPCIONAL)

```bash
# Opción A: Usando npm script (recomendado)
npm run cleanup:notifications

# Opción B: Directamente con ts-node
npx ts-node scripts/cleanup-test-notifications.ts

# Nota: Asegúrate de tener las variables de entorno configuradas en .env.local
```

### 3️⃣ Agregar Sonido de Notificación (OPCIONAL)

1. Descargar un sonido de notificación MP3 (0.5-1 segundo)
   - Fuentes gratuitas: [NotificationSounds.com](https://notificationsounds.com/)
2. Guardar como `public/sounds/notification.mp3`
3. Reiniciar el servidor: `npm run dev`

### 4️⃣ Probar las Nuevas Funcionalidades

1. **Preferencias:**
   - Iniciar sesión
   - Click en campana 🔔
   - Click en engranaje ⚙️
   - Configurar preferencias
   - Guardar

2. **Filtros:**
   - Click en campana 🔔
   - Usar botones "Todas" / "No leídas"
   - Seleccionar tipo de notificación

3. **Eliminar:**
   - Hover sobre una notificación
   - Click en icono de papelera 🗑️

4. **Sonido:**
   - Habilitar en preferencias
   - Crear una nueva notificación
   - Escuchar el sonido

---

## ✅ Verificación

Después de aplicar la migración, verifica:

```sql
-- Verificar que la tabla existe
SELECT * FROM notification_preferences LIMIT 1;

-- Verificar que se crearon preferencias para usuarios existentes
SELECT COUNT(*) FROM notification_preferences;
```

---

## 🐛 Solución de Problemas

### Error: "relation notification_preferences does not exist"
**Solución:** Aplicar la migración (Paso 1)

### Preferencias no se guardan
**Solución:** Verificar que la migración se aplicó correctamente

### Sonido no se reproduce
**Solución:** 
1. Verificar que el archivo existe en `public/sounds/notification.mp3`
2. Habilitar sonido en preferencias
3. Interactuar con la página primero (política de autoplay)

---

## 📚 Documentación Completa

Ver `NOTIFICATIONS_IMPROVEMENTS_COMPLETE.md` para documentación detallada.

---

**¡Listo!** 🎉 El sistema de notificaciones mejorado está activo.
