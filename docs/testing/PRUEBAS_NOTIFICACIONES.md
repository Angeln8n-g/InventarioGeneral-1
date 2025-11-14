# Guía de Pruebas - Sistema de Notificaciones

## ✅ Correcciones Aplicadas

Se han corregido los siguientes problemas:

1. **Error 404**: El endpoint ahora usa la ruta correcta `/api/notifications` con el body apropiado
2. **Estado no se actualiza**: RTK Query ahora invalida automáticamente el cache después de las mutaciones
3. **Marcar todas como leídas**: Nueva mutación implementada para marcar todas las notificaciones

## 🧪 Pasos para Probar

### 1. Iniciar el Servidor

```bash
npm run dev
```

### 2. Verificar Carga de Notificaciones

1. Abre el navegador en `http://localhost:3000`
2. Inicia sesión con cualquier usuario (ej: `admin` / `admin123`)
3. Verifica que aparece el icono de campana 🔔 en el header
4. Si hay notificaciones no leídas, deberías ver un badge rojo con el número

### 3. Probar Marcar Como Leída (Individual)

1. Click en el icono de campana para abrir el dropdown
2. Verifica que se muestran las notificaciones
3. Click en cualquier notificación no leída (las que tienen punto rojo)
4. **Resultado esperado**:
   - El punto rojo desaparece
   - El contador en el badge disminuye
   - La notificación cambia de color (de rojo claro a normal)
   - **NO debe aparecer error 404 en la consola**

### 4. Probar Marcar Todas Como Leídas

1. Abre el dropdown de notificaciones
2. Si hay notificaciones no leídas, verás el botón "Marcar todas como leídas"
3. Click en el botón
4. **Resultado esperado**:
   - Todas las notificaciones se marcan como leídas
   - El contador llega a 0
   - El badge desaparece
   - **NO debe aparecer error 404 en la consola**

### 5. Verificar Polling Automático

1. Abre dos navegadores o dos pestañas en modo incógnito
2. Inicia sesión con el mismo usuario en ambos
3. En el navegador 1, crea una acción que genere una notificación (ej: solicitar un préstamo)
4. En el navegador 2, espera hasta 30 segundos
5. **Resultado esperado**:
   - La nueva notificación aparece automáticamente
   - El contador se actualiza

## 🔍 Verificar en la Consola del Navegador

Abre las DevTools (F12) y ve a la pestaña "Network":

### Peticiones Esperadas

1. **GET /api/notifications**
   - Status: 200 OK
   - Response:
     ```json
     {
       "data": [...],
       "total": 5,
       "unread_count": 2
     }
     ```

2. **PUT /api/notifications** (marcar una como leída)
   - Status: 200 OK
   - Request Body:
     ```json
     {
       "action": "mark_read",
       "notification_id": 123
     }
     ```
   - Response:
     ```json
     {
       "data": {...},
       "message": "Notification marked as read"
     }
     ```

3. **PUT /api/notifications** (marcar todas como leídas)
   - Status: 200 OK
   - Request Body:
     ```json
     {
       "action": "mark_all_read"
     }
     ```
   - Response:
     ```json
     {
       "message": "All notifications marked as read"
     }
     ```

### ❌ Errores que NO Deberían Aparecer

- ~~404 Not Found en /api/notifications/123/read~~
- ~~500 Internal Server Error~~
- ~~TypeError en la consola~~

## 🎯 Casos de Prueba Específicos

### Caso 1: Usuario sin notificaciones

1. Inicia sesión con un usuario nuevo
2. **Resultado esperado**:
   - Icono de campana visible
   - Sin badge de contador
   - Al abrir dropdown: mensaje "No hay notificaciones"

### Caso 2: Usuario con solo notificaciones leídas

1. Marca todas las notificaciones como leídas
2. **Resultado esperado**:
   - Icono de campana visible
   - Sin badge de contador
   - Al abrir dropdown: lista de notificaciones sin puntos rojos
   - Sin botón "Marcar todas como leídas"

### Caso 3: Usuario con notificaciones mixtas

1. Marca algunas notificaciones como leídas
2. **Resultado esperado**:
   - Badge muestra solo las no leídas
   - Dropdown muestra todas (leídas y no leídas)
   - Notificaciones no leídas tienen punto rojo
   - Botón "Marcar todas como leídas" visible

## 🐛 Debugging

Si encuentras problemas, verifica:

### 1. Consola del Navegador

```javascript
// Abre la consola y ejecuta:
console.log('Redux State:', store.getState())
```

### 2. Network Tab

- Verifica que las peticiones se envían a `/api/notifications`
- Verifica que el body incluye `action` y `notification_id`
- Verifica que el status es 200, no 404

### 3. Base de Datos

```sql
-- Verifica que existen notificaciones
SELECT * FROM notifications WHERE user_id = 1;

-- Verifica el estado de las notificaciones
SELECT id, title, is_read, read_at FROM notifications WHERE user_id = 1;
```

## 📊 Tipos de Notificaciones Disponibles

El sistema genera notificaciones automáticamente para:

1. **loan_confirmation**: Cuando se crea un préstamo
2. **return_confirmation**: Cuando se devuelve una herramienta
3. **loan_reminder**: Recordatorio de préstamo próximo a vencer
4. **overdue_notice**: Aviso de préstamo vencido
5. **consumable_fulfilled**: Cuando se entrega un consumible
6. **consumable_backorder**: Cuando un consumible está en backorder
7. **system_announcement**: Anuncios del sistema (admin)
8. **stock_alert**: Alertas de stock bajo (admin)
9. **system_maintenance**: Avisos de mantenimiento (admin)

## 🎨 Verificar UI/UX

### Tema Claro

- Badge rojo sobre fondo blanco
- Dropdown con fondo blanco
- Texto negro/gris

### Tema Oscuro

- Badge rojo sobre fondo oscuro
- Dropdown con fondo gris oscuro
- Texto blanco/gris claro

### Animaciones

- Dropdown aparece con fade-in
- Punto rojo de notificaciones no leídas pulsa
- Hover effects en botones

## ✅ Checklist de Verificación

- [ ] Las notificaciones se cargan correctamente
- [ ] El contador muestra el número correcto
- [ ] Marcar una notificación como leída funciona
- [ ] El estado se actualiza inmediatamente
- [ ] Marcar todas como leídas funciona
- [ ] No hay errores 404 en la consola
- [ ] El polling automático funciona (30s)
- [ ] La UI se ve bien en tema claro
- [ ] La UI se ve bien en tema oscuro
- [ ] Las animaciones funcionan correctamente

## 🚀 Próximos Pasos

Si todo funciona correctamente, puedes:

1. Probar en diferentes navegadores (Chrome, Firefox, Edge)
2. Probar en dispositivos móviles
3. Verificar el rendimiento con muchas notificaciones
4. Considerar implementar las mejoras sugeridas en `NOTIFICATIONS_FIX_SUMMARY.md`

## 📞 Soporte

Si encuentras algún problema:

1. Verifica la consola del navegador
2. Verifica la consola del servidor
3. Revisa los logs de Supabase
4. Consulta `NOTIFICATIONS_FIX_SUMMARY.md` para más detalles técnicos
