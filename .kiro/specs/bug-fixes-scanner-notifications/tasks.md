# Implementation Plan

- [x] 1. Corregir tema oscuro en la página del scanner

  - Revisar el componente `src/app/scanner/page.tsx`
  - Asegurar que el contenedor principal tenga clases de fondo para tema oscuro
  - Verificar que todas las tarjetas y elementos usen las clases dark:\* apropiadas
  - Probar en modo oscuro para confirmar que todos los elementos sean visibles
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Implementar favicon en la aplicación

  - Crear archivo `src/app/icon.tsx` con el emoji 🎓 como favicon
  - Configurar el tamaño (32x32) y tipo de contenido (image/png)
  - Usar ImageResponse de next/og para generar el icono dinámicamente
  - Aplicar fondo rojo (#E30613) para mantener consistencia con el branding

  - Verificar que el favicon aparezca en la pestaña del navegador
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implementar funcionalidad del dropdown de notificaciones

  - Modificar `src/components/layout/Header.tsx`
  - Importar el componente `NotificationsDropdown` existente
  - Agregar estado `showNotificationsDropdown` para controlar la visibilidad
  - Implementar handler `handleMarkAsRead` para marcar notificaciones individuales como leídas
  - Implementar handler `handleMarkAllAsRead` para marcar todas como leídas
  - Agregar onClick al botón de notificaciones para toggle del dropdown
  - Renderizar el componente NotificationsDropdown con las props correctas
  - Mapear las notificaciones de la API al formato esperado por el componente
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]\* 3.1 Testing completo de las correcciones
  - Probar tema oscuro en scanner en diferentes dispositivos
  - Verificar favicon en Chrome, Firefox, Safari y Edge
  - Probar funcionalidad completa de notificaciones (abrir, cerrar, marcar como leída)
  - Verificar que el contador se actualice correctamente
  - Probar navegación entre páginas con notificaciones abiertas
  - Verificar accesibilidad con teclado
  - Verificar que no haya errores en consola
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
