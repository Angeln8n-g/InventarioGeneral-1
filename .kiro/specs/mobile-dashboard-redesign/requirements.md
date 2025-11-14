# Requirements Document - Mobile Dashboard Redesign

## Introduction

Este documento define los requisitos para el rediseño completo del dashboard principal de la aplicación, con un enfoque mobile-first optimizado para usuarios (profesores/personal). El objetivo es crear una experiencia de usuario fluida, rápida y con mínima fricción, priorizando las acciones más comunes y frecuentes.

## Requirements

### Requirement 1: Header Superior Mejorado

**User Story:** Como usuario, quiero ver un header personalizado y accesible para tener acceso rápido a notificaciones y mi perfil.

#### Acceptance Criteria

1. WHEN el usuario accede al dashboard THEN el sistema SHALL mostrar un saludo personalizado "¡Hola, [Nombre del Usuario]!"
2. WHEN hay notificaciones no leídas THEN el sistema SHALL mostrar un icono de campana con un badge numérico rojo
3. WHEN el usuario toca el icono de notificaciones THEN el sistema SHALL navegar a la página de notificaciones
4. WHEN el usuario toca su avatar/inicial THEN el sistema SHALL mostrar un menú desplegable con opciones de perfil y cerrar sesión
5. IF no hay notificaciones THEN el sistema SHALL mostrar el icono de campana sin badge

### Requirement 2: Área de Acción Principal con Botones Grandes

**User Story:** Como usuario, quiero acceder rápidamente a las acciones más comunes para minimizar el tiempo de interacción.

#### Acceptance Criteria

1. WHEN el usuario ve el dashboard THEN el sistema SHALL mostrar tres botones grandes y prominentes
2. WHEN el usuario toca "Escanear para Prestar" THEN el sistema SHALL abrir el escáner QR en modo préstamo
3. WHEN el usuario toca "Escanear para Devolver" THEN el sistema SHALL abrir el escáner QR en modo devolución
4. WHEN el usuario toca "Solicitar Consumibles" THEN el sistema SHALL navegar a la página de consumibles
5. IF el dispositivo es móvil THEN los botones SHALL ocupar el ancho completo con espaciado adecuado
6. WHEN el usuario toca un botón THEN el sistema SHALL proporcionar feedback visual inmediato

### Requirement 3: Sección de Resumen "Mis Préstamos Activos"

**User Story:** Como usuario, quiero ver rápidamente mis préstamos activos para saber qué herramientas tengo y cuándo debo devolverlas.

#### Acceptance Criteria

1. WHEN el usuario tiene préstamos activos THEN el sistema SHALL mostrar una lista compacta y deslizable
2. WHEN se muestra un préstamo THEN el sistema SHALL incluir el nombre de la herramienta y la fecha de devolución
3. IF la fecha de devolución ha pasado THEN el sistema SHALL mostrar la fecha en rojo
4. WHEN el usuario toca el botón "Devolver" THEN el sistema SHALL iniciar el flujo de devolución para esa herramienta
5. IF no hay préstamos activos THEN el sistema SHALL mostrar un mensaje amigable con un icono
6. WHEN hay más de 3 préstamos THEN la lista SHALL ser deslizable verticalmente

### Requirement 4: Navegación Inferior (Bottom Navigation Bar)

**User Story:** Como usuario, quiero navegar fácilmente entre las secciones principales de la aplicación desde cualquier pantalla.

#### Acceptance Criteria

1. WHEN el usuario está en cualquier pantalla THEN el sistema SHALL mostrar una barra de navegación inferior fija
2. WHEN el usuario toca "Inicio" THEN el sistema SHALL navegar al dashboard principal
3. WHEN el usuario toca "Préstamos" THEN el sistema SHALL navegar a la página de todos los préstamos
4. WHEN el usuario toca "Notificaciones" THEN el sistema SHALL navegar a la página de notificaciones
5. WHEN el usuario toca "Perfil" THEN el sistema SHALL navegar a la página de perfil
6. WHEN el usuario está en una sección THEN el icono correspondiente SHALL estar resaltado
7. IF hay notificaciones no leídas THEN el icono de notificaciones SHALL mostrar un badge

### Requirement 5: Diseño Responsive y Mobile-First

**User Story:** Como usuario móvil, quiero que la aplicación se vea y funcione perfectamente en mi dispositivo para tener la mejor experiencia posible.

#### Acceptance Criteria

1. WHEN el usuario accede desde un dispositivo móvil THEN el sistema SHALL mostrar el diseño optimizado para móvil
2. WHEN el usuario accede desde tablet THEN el sistema SHALL adaptar el diseño manteniendo la usabilidad
3. WHEN el usuario accede desde desktop THEN el sistema SHALL mostrar un diseño adaptado con mejor uso del espacio
4. WHEN el usuario rota el dispositivo THEN el sistema SHALL adaptar el layout automáticamente
5. IF el dispositivo tiene pantalla pequeña (<375px) THEN los elementos SHALL ajustarse sin scroll horizontal

### Requirement 6: Botón de Acceso Rápido "Mis Préstamos"

**User Story:** Como usuario, quiero acceder rápidamente a la vista completa de mis préstamos desde el dashboard.

#### Acceptance Criteria

1. WHEN el usuario ve el área de acción principal THEN el sistema SHALL mostrar un botón "Mis Préstamos"
2. WHEN el usuario toca "Mis Préstamos" THEN el sistema SHALL navegar a /my-loans
3. WHEN el usuario tiene préstamos activos THEN el botón SHALL mostrar un contador
4. IF no hay préstamos activos THEN el botón SHALL estar visible pero sin contador

### Requirement 7: Optimización de Performance

**User Story:** Como usuario, quiero que la aplicación cargue rápidamente y responda de inmediato a mis acciones.

#### Acceptance Criteria

1. WHEN el usuario accede al dashboard THEN el sistema SHALL cargar en menos de 2 segundos
2. WHEN el usuario toca un botón THEN el sistema SHALL responder en menos de 100ms
3. WHEN se cargan los préstamos activos THEN el sistema SHALL mostrar un skeleton loader
4. IF la conexión es lenta THEN el sistema SHALL mostrar indicadores de carga apropiados
5. WHEN se navega entre secciones THEN las transiciones SHALL ser suaves (60fps)

### Requirement 8: Accesibilidad y Usabilidad

**User Story:** Como usuario, quiero que la aplicación sea fácil de usar y accesible para todos.

#### Acceptance Criteria

1. WHEN el usuario interactúa con botones THEN el sistema SHALL proporcionar áreas de toque de al menos 44x44px
2. WHEN el usuario usa un lector de pantalla THEN todos los elementos SHALL tener labels descriptivos
3. WHEN el usuario navega con teclado THEN todos los elementos interactivos SHALL ser accesibles
4. IF el usuario tiene modo oscuro activado THEN el sistema SHALL respetar la preferencia
5. WHEN hay errores THEN el sistema SHALL mostrar mensajes claros y accionables

### Requirement 9: Integración con PWA

**User Story:** Como usuario, quiero instalar la aplicación en mi dispositivo para acceder rápidamente como una app nativa.

#### Acceptance Criteria

1. WHEN el usuario visita la aplicación THEN el navegador SHALL ofrecer instalarla como PWA
2. WHEN la aplicación está instalada THEN el sistema SHALL funcionar offline para funciones básicas
3. WHEN hay actualizaciones THEN el sistema SHALL notificar al usuario
4. IF el usuario está offline THEN el sistema SHALL mostrar un mensaje apropiado
5. WHEN se instala la PWA THEN el sistema SHALL usar el icono y nombre configurados

### Requirement 10: Animaciones y Transiciones

**User Story:** Como usuario, quiero que la aplicación se sienta fluida y moderna con transiciones suaves.

#### Acceptance Criteria

1. WHEN el usuario toca un botón THEN el sistema SHALL mostrar una animación de feedback
2. WHEN se carga contenido THEN el sistema SHALL usar animaciones de fade-in
3. WHEN se navega entre páginas THEN el sistema SHALL usar transiciones suaves
4. IF el usuario prefiere movimiento reducido THEN el sistema SHALL respetar la preferencia
5. WHEN se muestran notificaciones THEN el sistema SHALL usar animaciones de slide-in
