# Requirements Document

## Introduction

Este documento define los requisitos para optimizar las páginas que utilizan imágenes de fondo en la aplicación. Actualmente, 5 páginas principales cargan imágenes de fondo de gran tamaño sin optimización, lo que resulta en tiempos de carga lentos y una experiencia de usuario subóptima, especialmente en conexiones lentas o dispositivos móviles. El objetivo es implementar técnicas de optimización modernas para mejorar significativamente los tiempos de carga y la fluidez de estas páginas.

Las páginas afectadas son:
- `/login` - login-background.jpg
- `/tools/scan` - solicitar-herramientas-background.jpg
- `/tools/return` - Devoluciones-background.jpg
- `/consumables/scan` - solicitar-materiales-background.jpg
- `/consumables/return` - solicitar-materiales-background.jpg

## Requirements

### Requirement 1: Optimización de Imágenes de Fondo

**User Story:** Como usuario de la aplicación, quiero que las páginas con imágenes de fondo carguen rápidamente, para que pueda acceder al contenido sin demoras perceptibles.

#### Acceptance Criteria

1. WHEN el usuario navega a una página con imagen de fondo THEN la imagen SHALL cargarse en formato WebP optimizado con fallback a JPEG
2. WHEN se carga una imagen de fondo THEN el sistema SHALL servir versiones responsive apropiadas según el tamaño de pantalla del dispositivo
3. WHEN se procesa una imagen de fondo THEN el sistema SHALL generar versiones en múltiples resoluciones (móvil: 640px, tablet: 1024px, desktop: 1920px)
4. WHEN se optimiza una imagen THEN el tamaño del archivo SHALL reducirse en al menos 60% comparado con la versión original sin pérdida visible de calidad
5. IF una imagen de fondo es mayor a 500KB THEN el sistema SHALL aplicar compresión adicional hasta alcanzar un tamaño óptimo

### Requirement 2: Carga Progresiva y Lazy Loading

**User Story:** Como usuario, quiero ver contenido útil inmediatamente mientras la imagen de fondo se carga, para que la aplicación se sienta rápida y responsive.

#### Acceptance Criteria

1. WHEN una página con imagen de fondo se carga THEN el sistema SHALL mostrar un placeholder blur-up de baja resolución (LQIP) inmediatamente
2. WHEN el placeholder está visible THEN la imagen de alta resolución SHALL cargarse en segundo plano de forma progresiva
3. WHEN la imagen de alta resolución termina de cargar THEN el sistema SHALL realizar una transición suave desde el placeholder
4. WHEN se implementa lazy loading THEN las imágenes de fondo SHALL cargarse solo cuando la página está visible (no en pre-fetch de rutas)
5. WHEN se genera un LQIP THEN el placeholder SHALL ser menor a 2KB y tener dimensiones de máximo 20px de ancho

### Requirement 3: Uso del Componente Next.js Image

**User Story:** Como desarrollador, quiero utilizar las capacidades de optimización automática de Next.js, para que las imágenes se sirvan de forma óptima sin configuración manual compleja.

#### Acceptance Criteria

1. WHEN se implementa una imagen de fondo THEN el código SHALL utilizar el componente `next/image` en lugar de CSS `backgroundImage`
2. WHEN se usa `next/image` THEN el componente SHALL configurarse con `priority={true}` para la página de login
3. WHEN se usa `next/image` THEN el componente SHALL configurarse con `loading="lazy"` para páginas secundarias
4. WHEN se configura `next/image` THEN el componente SHALL usar `fill` y `object-fit: cover` para comportamiento de background
5. WHEN se implementa el componente THEN el código SHALL incluir `sizes` apropiados para responsive images

### Requirement 4: Caché y Performance

**User Story:** Como usuario recurrente, quiero que las imágenes de fondo se carguen instantáneamente en visitas subsecuentes, para que la aplicación se sienta más rápida con el uso.

#### Acceptance Criteria

1. WHEN una imagen de fondo se sirve THEN el servidor SHALL incluir headers de caché apropiados (Cache-Control: public, max-age=31536000, immutable)
2. WHEN se optimiza una imagen THEN Next.js SHALL cachear la versión optimizada en el servidor
3. WHEN el navegador solicita una imagen previamente cargada THEN el sistema SHALL servirla desde el caché del navegador
4. WHEN se actualiza una imagen de fondo THEN el sistema SHALL usar un nuevo nombre de archivo o hash para invalidar el caché
5. WHEN se mide el performance THEN el Largest Contentful Paint (LCP) de páginas con imágenes de fondo SHALL ser menor a 2.5 segundos

### Requirement 5: Consistencia de Implementación

**User Story:** Como desarrollador, quiero que todas las páginas con imágenes de fondo usen el mismo patrón de implementación, para que el código sea mantenible y consistente.

#### Acceptance Criteria

1. WHEN se implementa una imagen de fondo THEN todas las páginas afectadas SHALL usar el mismo patrón de código
2. WHEN se crea el patrón THEN el código SHALL extraerse a un componente reutilizable `OptimizedBackgroundImage`
3. WHEN se usa el componente THEN el componente SHALL aceptar props para `src`, `alt`, `priority`, y `opacity`
4. WHEN se refactoriza el código THEN todas las 5 páginas identificadas SHALL migrar al nuevo componente
5. WHEN se completa la implementación THEN el código SHALL eliminar todos los usos de `style={{ backgroundImage: 'url(...)' }}`

### Requirement 6: Medición y Validación

**User Story:** Como desarrollador, quiero medir objetivamente las mejoras de performance, para que pueda validar que la optimización fue exitosa.

#### Acceptance Criteria

1. WHEN se completa la optimización THEN el equipo SHALL medir el tiempo de carga antes y después usando Lighthouse
2. WHEN se ejecuta Lighthouse THEN el Performance Score SHALL mejorar en al menos 15 puntos
3. WHEN se mide el LCP THEN el valor SHALL reducirse en al menos 40% comparado con la implementación original
4. WHEN se mide el tamaño de transferencia THEN el total de bytes transferidos para imágenes de fondo SHALL reducirse en al menos 60%
5. WHEN se valida en dispositivos móviles THEN las páginas SHALL cargar completamente en menos de 3 segundos en conexión 3G

### Requirement 7: Compatibilidad y Fallbacks

**User Story:** Como usuario con un navegador antiguo, quiero que las páginas sigan funcionando correctamente, para que pueda usar la aplicación sin problemas visuales.

#### Acceptance Criteria

1. WHEN un navegador no soporta WebP THEN el sistema SHALL servir automáticamente la versión JPEG
2. WHEN JavaScript está deshabilitado THEN la página SHALL mostrar al menos el placeholder o una versión estática de la imagen
3. WHEN hay un error cargando la imagen THEN el sistema SHALL mostrar un gradiente de respaldo que coincida con el tema
4. WHEN se prueba en navegadores legacy THEN las páginas SHALL mantener funcionalidad completa en Chrome 90+, Firefox 88+, Safari 14+
5. WHEN falla la carga de imagen THEN el contenido de la página SHALL permanecer completamente accesible y usable
