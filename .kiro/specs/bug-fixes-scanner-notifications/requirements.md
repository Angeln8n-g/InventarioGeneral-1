# Requirements Document

## Introduction

Este spec aborda tres problemas identificados en la aplicación:
1. El tema oscuro no se aplica correctamente en la página del scanner
2. Falta el icono/favicon en la barra de navegación del navegador
3. La lógica de notificaciones no funciona correctamente

Estos son bugs críticos que afectan la experiencia del usuario y la consistencia visual de la aplicación.

## Requirements

### Requirement 1: Corregir Tema Oscuro en Scanner

**User Story:** Como usuario que prefiere el modo oscuro, quiero que la página del scanner respete mi preferencia de tema, para tener una experiencia visual consistente en toda la aplicación.

#### Acceptance Criteria

1. WHEN un usuario con tema oscuro activado accede a `/scanner` THEN el sistema SHALL aplicar los estilos de tema oscuro correctamente
2. WHEN la página del scanner se muestra en modo oscuro THEN el fondo SHALL ser oscuro y el texto SHALL tener contraste adecuado
3. WHEN las tarjetas de "Escanear Suministros" y "Escanear Herramientas" se muestran en modo oscuro THEN SHALL usar las clases de tema oscuro apropiadas
4. WHEN el usuario cambia entre tema claro y oscuro THEN la página del scanner SHALL actualizar los estilos inmediatamente
5. WHEN el header de la página se muestra THEN SHALL respetar el tema actual (rojo en claro, adaptado en oscuro)

### Requirement 2: Implementar Favicon en la Aplicación

**User Story:** Como usuario, quiero ver el icono de "Inventario Academia" en la pestaña del navegador, para identificar fácilmente la aplicación entre múltiples pestañas abiertas.

#### Acceptance Criteria

1. WHEN un usuario accede a cualquier página de la aplicación THEN el sistema SHALL mostrar el favicon en la pestaña del navegador
2. WHEN el favicon se muestra THEN SHALL ser el emoji 🎓 o un icono representativo de "Inventario Academia"
3. WHEN la aplicación se agrega a favoritos THEN el favicon SHALL aparecer junto al nombre
4. WHEN la aplicación se visualiza en diferentes navegadores THEN el favicon SHALL mostrarse correctamente en todos ellos
5. WHEN hay errores de consola relacionados con favicon.ico THEN el sistema SHALL resolverlos

### Requirement 3: Corregir Lógica de Notificaciones

**User Story:** Como usuario, quiero que las notificaciones se muestren y actualicen correctamente, para estar informado sobre eventos importantes del sistema.

#### Acceptance Criteria

1. WHEN un usuario tiene notificaciones pendientes THEN el sistema SHALL mostrar el contador correcto en el icono de notificaciones
2. WHEN un usuario hace clic en el icono de notificaciones THEN el sistema SHALL mostrar la lista de notificaciones
3. WHEN una notificación es marcada como leída THEN el contador SHALL actualizarse inmediatamente
4. WHEN se crea una nueva notificación THEN el contador SHALL incrementarse automáticamente
5. WHEN no hay notificaciones pendientes THEN el contador no SHALL mostrarse o SHALL mostrar 0
6. WHEN el usuario navega entre páginas THEN el estado de las notificaciones SHALL persistir correctamente
7. WHEN hay errores en la API de notificaciones THEN el sistema SHALL manejarlos sin romper la interfaz
