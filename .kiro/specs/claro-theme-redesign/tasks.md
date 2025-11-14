# Implementation Plan - Claro Theme Redesign

- [x] 1. Actualizar configuración de Tailwind con paleta Claro

  - Reemplazar todos los colores neón (neon-cyan, neon-purple, neon-pink, etc.) con los colores corporativos de Claro
  - Definir variables semánticas: claro-red (#E30613), claro-green (#4CAF50), claro-warning (#FF9800), claro-blue (#1976D2)
  - Actualizar colores de fondo: background-light (#F4F4F4), background-dark (#121212), card-light (#FFFFFF), card-dark (#1E1E1E)
  - Actualizar colores de texto: text-light (#212121), text-dark (#FFFFFF), text-secondary-light (#757575), text-secondary-dark (#A3A3A3)
  - Eliminar definiciones de sombras neón (shadow-neon-cyan, shadow-neon-purple, etc.)
  - Eliminar animaciones neón (pulse-glow, border-flow) de la configuración
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 2. Actualizar estilos CSS globales

  - Eliminar todas las clases CSS relacionadas con efectos neón (.neon-border, .neon-text-cyan, .neon-text-purple, .neon-text-pink, .neon-text-green, .neon-gradient-cyan-purple, .neon-gradient-pink-orange, .neon-gradient-green)
  - Eliminar efectos hover neón (.hover-glow-cyan, .hover-glow-purple, .hover-glow-green)
  - Eliminar clase .neon-card y sus animaciones asociadas
  - Crear clase .claro-border para bordes sutiles con color Claro
  - Crear clase .claro-button-primary para botones principales con rojo Claro
  - Crear clase .claro-button-secondary para botones secundarios con borde rojo
  - Crear clase .claro-card-hover para efectos hover sutiles en cards
  - Crear clases para badges (.claro-badge-active, .claro-badge-warning, .claro-badge-error)
  - Crear clase .claro-tab-indicator para indicador de tab activo
  - Mantener animaciones funcionales (fade-in, slide-up, shimmer) ajustando colores a paleta Claro
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 3. Actualizar componente Button

  - Reemplazar clase neon-gradient-cyan-purple con claro-button-primary en variante primary
  - Actualizar variante secondary para usar claro-button-secondary con borde rojo Claro
  - Reemplazar neon-gradient-pink-orange con bg-claro-red en variante danger
  - Actualizar efectos hover para usar sombras sutiles en lugar de shadow-neon-cyan
  - Actualizar focus ring para usar ring-claro-red
  - Mantener todas las transiciones (duration-300) y estados (loading, disabled)
  - Verificar que todos los event handlers funcionen correctamente
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 8.1, 8.2, 8.7_

- [x] 4. Actualizar componente BottomNavigation

  - Reemplazar dark:neon-border con dark:border-gray-700 en el borde superior
  - Eliminar dark:shadow-neon-cyan y usar shadow-lg estándar
  - Cambiar color de iconos activos de text-primary a text-claro-red
  - Actualizar indicador activo (bottom bar) para usar bg-claro-red en lugar de bg-primary
  - Eliminar animate-pulse-glow del indicador activo
  - Cambiar badges de bg-red-accent a bg-claro-red
  - Mantener todas las transiciones y animaciones de navegación
  - Verificar que la navegación funcione correctamente en ambos temas
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 6.3, 8.1, 8.3, 8.7_

- [x] 5. Actualizar componente MobileHeader

  - Reemplazar dark:bg-card-elevated con dark:bg-card-dark
  - Cambiar dark:neon-border por dark:border-gray-700
  - Eliminar dark:shadow-neon-cyan y usar shadow-md estándar
  - Reemplazar dark:neon-text-cyan en título con dark:text-claro-red
  - Eliminar animate-pulse-icon de iconos y usar transiciones sutiles
  - Mantener estructura HTML y funcionalidad de menú desplegable
  - _Requirements: 5.1, 5.7, 6.4, 6.5, 8.1, 8.3_

- [x] 6. Actualizar componente ActiveLoansSection

  - Cambiar dark:neon-text-cyan en título por dark:text-claro-red
  - Reemplazar bg-neon-purple en badge con bg-claro-red
  - Eliminar shadow-neon-purple del badge y usar shadow-sm
  - Eliminar animate-pulse del badge de conteo
  - Actualizar estados de carga manteniendo animate-shimmer con colores Claro
  - Mantener funcionalidad de carga y manejo de estados vacíos
  - _Requirements: 5.2, 5.5, 5.8, 8.2, 8.6_

- [x] 7. Actualizar componente LoanCard

  - Reemplazar dark:bg-card-elevated con dark:bg-card-dark
  - Cambiar dark:neon-border por dark:border-gray-700
  - Eliminar hover-glow-cyan y reemplazar con claro-card-hover
  - Actualizar badge "overdue" de neon-pink a claro-red
  - Eliminar shadow-neon-pink del badge overdue
  - Reemplazar neon-gradient-green en botón de retorno con bg-claro-green
  - Mantener todas las transiciones y efectos hover sutiles
  - Verificar que los event handlers de retorno funcionen
  - _Requirements: 5.3, 5.7, 7.6, 8.1, 8.3, 8.7_

- [x] 8. Actualizar componente Header (layout)

  - Cambiar fondo de barra superior para usar bg-claro-red en ambos temas
  - Actualizar menú desplegable con bg-card-light dark:bg-card-dark
  - Reemplazar bordes neón con bordes sutiles usando border-gray-200 dark:border-gray-700
  - Eliminar sombras neón y usar shadow-lg estándar
  - Asegurar que el logo o marca use el rojo Claro prominentemente
  - Mantener todas las transiciones de apertura/cierre de menú
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.7, 8.1, 8.6_

- [x] 9. Actualizar componente MobileNavigation (layout)

  - Aplicar bg-claro-red para elementos activos
  - Reemplazar dark:neon-border con dark:border-gray-700
  - Eliminar sombras neón y usar sombras sutiles
  - Mantener transiciones suaves entre estados
  - Verificar funcionalidad de navegación en móvil
  - _Requirements: 6.3, 6.4, 6.5, 6.6, 8.1_

- [x] 10. Crear documentación del tema Claro

  - Crear archivo CLARO_THEME_GUIDE.md con paleta completa de colores
  - Documentar todos los códigos hexadecimales con sus usos específicos
  - Incluir ejemplos de código para cada tipo de componente (Button, Card, Badge, etc.)
  - Documentar patrones de uso y mejores prácticas
  - Incluir ejemplos antes/después para facilitar futuras actualizaciones
  - Documentar la lógica del tema oscuro (inversión de fondos, mantenimiento de acentos)
  - Listar todas las clases CSS disponibles relacionadas con el tema Claro
  - Archivar o actualizar referencias a NEON_THEME_GUIDE.md y NEON_THEME_IMPLEMENTATION.md
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 11. Realizar testing de contraste y accesibilidad

  - Verificar contraste de text-light (#212121) en background-light (#F4F4F4) cumple WCAG AA
  - Verificar contraste de text-dark (#FFFFFF) en background-dark (#121212) cumple WCAG AA
  - Verificar contraste de claro-red (#E30613) en fondos blancos y oscuros
  - Probar con herramientas de simulación de daltonismo
  - Verificar que todos los aria-label y aria-current estén presentes
  - Asegurar que estados no dependan solo de color
  - _Requirements: 10.5, 10.8_

- [x] 12. Realizar testing visual en componentes

  - Probar Dashboard completo en modo claro verificando todos los colores
  - Probar Dashboard completo en modo oscuro verificando contraste
  - Verificar todos los estados de botones (normal, hover, active, disabled)
  - Verificar cards en diferentes estados (normal, hover, loading)
  - Verificar navegación (activa, inactiva, con badges)
  - Probar transición suave entre tema claro y oscuro
  - Verificar que badges y alertas usen colores correctos y sean distinguibles
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7, 10.8_

- [ ]\* 13. Realizar testing cross-browser
  - Probar en Chrome (latest) verificando renderizado de colores
  - Probar en Firefox (latest) verificando transiciones
  - Probar en Safari (latest) verificando hover effects
  - Probar en Edge (latest) verificando theme toggle
  - Probar en Mobile Safari (iOS) verificando colores en móvil
  - Probar en Chrome Mobile (Android) verificando persistencia de tema
  - _Requirements: 10.4_
