# ✅ Checklist de Implementación - Sistema de Notificaciones Mejorado

## Pre-requisitos

- [ ] Node.js instalado
- [ ] Acceso a Supabase
- [ ] Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 1: Aplicar Migración de Base de Datos

### Opción A: Usando psql (Recomendado)
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/20250106_notification_preferences.sql
```

### Opción B: Desde Supabase Dashboard
1. [ ] Ir a SQL Editor en Supabase Dashboard
2. [ ] Abrir `supabase/migrations/20250106_notification_preferences.sql`
3. [ ] Copiar todo el contenido
4. [ ] Pegar en SQL Editor
5. [ ] Ejecutar (Run)

### Verificación:
```sql
-- Verificar que la tabla existe
SELECT * FROM notification_preferences LIMIT 1;

-- Verificar que se crearon preferencias para usuarios existentes
SELECT COUNT(*) FROM notification_preferences;
```

- [ ] Migración aplicada exitosamente
- [ ] Tabla `notification_preferences` existe
- [ ] Preferencias creadas para usuarios existentes

---

## Paso 2: Instalar Dependencias (Si es necesario)

```bash
npm install
```

- [ ] Dependencias instaladas

---

## Paso 3: Verificar Tipos TypeScript

```bash
npm run type-check
```

- [ ] Sin errores de TypeScript

---

## Paso 4: Limpiar Notificaciones de Prueba (Opcional)

```bash
npm run cleanup:notifications
```

- [ ] Notificaciones de prueba eliminadas

---

## Paso 5: Agregar Sonido de Notificación (Opcional)

1. [ ] Descargar sonido MP3 (0.5-1 segundo)
   - Fuentes: [NotificationSounds.com](https://notificationsounds.com/), [FreeSound.org](https://freesound.org/)
2. [ ] Guardar como `public/sounds/notification.mp3`
3. [ ] Verificar que el archivo existe

---

## Paso 6: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

- [ ] Servidor iniciado sin errores
- [ ] Aplicación accesible en http://localhost:3000

---

## Paso 7: Probar Funcionalidades

### Preferencias de Notificaciones:
1. [ ] Iniciar sesión
2. [ ] Click en icono de campana 🔔
3. [ ] Click en icono de engranaje ⚙️
4. [ ] Modal de preferencias se abre
5. [ ] Cambiar algunas preferencias
6. [ ] Click en "Guardar Cambios"
7. [ ] Mensaje de éxito
8. [ ] Recargar página
9. [ ] Verificar que las preferencias se guardaron

### Filtros:
1. [ ] Click en icono de campana 🔔
2. [ ] Ver botones "Todas" / "No leídas"
3. [ ] Click en "No leídas"
4. [ ] Solo se muestran notificaciones no leídas
5. [ ] Ver dropdown de tipos
6. [ ] Seleccionar un tipo específico
7. [ ] Solo se muestran notificaciones de ese tipo
8. [ ] Contador se actualiza correctamente

### Eliminar Notificaciones:
1. [ ] Click en icono de campana 🔔
2. [ ] Hover sobre una notificación
3. [ ] Aparece icono de papelera 🗑️
4. [ ] Click en papelera
5. [ ] Notificación se elimina
6. [ ] Contador se actualiza

### Sonido (Si se agregó):
1. [ ] Abrir preferencias
2. [ ] Habilitar "Sonido de notificaciones"
3. [ ] Guardar
4. [ ] Crear una nueva notificación (desde otro navegador/sesión)
5. [ ] Esperar 30 segundos (polling)
6. [ ] Verificar que suena

### Paginación:
1. [ ] Abrir DevTools > Network
2. [ ] Click en icono de campana 🔔
3. [ ] Verificar request a `/api/notifications?page=1&limit=20`
4. [ ] Verificar response con metadatos:
   - `page`
   - `limit`
   - `total`
   - `totalPages`
   - `unread_count`

---

## Paso 8: Verificar en Diferentes Navegadores

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (si disponible)

---

## Paso 9: Verificar Modo Oscuro

1. [ ] Cambiar a modo oscuro
2. [ ] Verificar que todos los componentes se ven bien
3. [ ] Probar todas las funcionalidades

---

## Paso 10: Verificar Responsividad

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Paso 11: Pruebas de Seguridad

### Autenticación:
1. [ ] Cerrar sesión
2. [ ] Intentar acceder a `/api/notifications`
3. [ ] Verificar error 401

### Permisos:
1. [ ] Intentar eliminar notificación de otro usuario
2. [ ] Verificar error 404 o 403

---

## Paso 12: Pruebas de Rendimiento

1. [ ] Crear 100+ notificaciones
2. [ ] Verificar que la paginación funciona
3. [ ] Verificar que no hay lag
4. [ ] Verificar que el polling no causa problemas

---

## Paso 13: Documentación

- [ ] Leer `NOTIFICATIONS_IMPROVEMENTS_COMPLETE.md`
- [ ] Leer `QUICK_START_NOTIFICATIONS.md`
- [ ] Leer `NOTIFICATIONS_UPGRADE_SUMMARY.md`
- [ ] Entender la arquitectura

---

## Paso 14: Build de Producción

```bash
npm run build
```

- [ ] Build exitoso sin errores
- [ ] Sin warnings críticos

---

## Paso 15: Despliegue (Opcional)

1. [ ] Aplicar migración en producción
2. [ ] Desplegar código
3. [ ] Verificar que todo funciona
4. [ ] Monitorear logs

---

## Troubleshooting

### Error: "relation notification_preferences does not exist"
- [ ] Aplicar migración de base de datos

### Preferencias no se guardan
- [ ] Verificar que la migración se aplicó
- [ ] Verificar logs del servidor
- [ ] Verificar variables de entorno

### Sonido no se reproduce
- [ ] Verificar que el archivo existe
- [ ] Verificar que está habilitado en preferencias
- [ ] Interactuar con la página primero (política de autoplay)
- [ ] Verificar consola del navegador

### Filtros no funcionan
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que la API responde correctamente
- [ ] Limpiar cache del navegador

---

## Checklist Final

- [ ] Migración aplicada
- [ ] Tipos verificados
- [ ] Servidor funciona
- [ ] Todas las funcionalidades probadas
- [ ] Sin errores en consola
- [ ] Build de producción exitoso
- [ ] Documentación leída
- [ ] Equipo informado

---

## 🎉 ¡Completado!

Si todos los checkboxes están marcados, el sistema de notificaciones mejorado está completamente implementado y funcionando.

**Fecha de Completación:** _______________

**Implementado por:** _______________

**Notas adicionales:**
_______________________________________________
_______________________________________________
_______________________________________________
