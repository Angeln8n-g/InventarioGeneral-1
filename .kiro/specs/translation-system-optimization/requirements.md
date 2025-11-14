# Requirements Document

## Introduction

El sistema de gestión de inventario educativo actualmente tiene un sistema de traducción implementado que soporta inglés y español. Sin embargo, después de múltiples cambios en el código, el sistema de traducción no está funcionando correctamente en todas las páginas y componentes. Este documento define los requisitos para optimizar y completar el sistema de traducción existente.

## Requirements

### Requirement 1: Auditoría del Sistema de Traducción Actual

**User Story:** Como desarrollador, quiero auditar el sistema de traducción actual para identificar qué está funcionando y qué necesita ser corregido, para poder priorizar las correcciones.

#### Acceptance Criteria

1. WHEN se ejecuta una auditoría del código THEN el sistema SHALL identificar todas las páginas y componentes que usan traducciones
2. WHEN se revisa el diccionario de traducciones THEN el sistema SHALL listar todas las claves de traducción definidas
3. WHEN se comparan las traducciones usadas vs definidas THEN el sistema SHALL identificar claves faltantes o no utilizadas
4. WHEN se revisan los componentes THEN el sistema SHALL identificar textos hardcodeados que deberían estar traducidos
5. IF existen claves de traducción sin definir THEN el sistema SHALL generar un reporte con las claves faltantes

### Requirement 2: Completar Diccionario de Traducciones

**User Story:** Como usuario del sistema, quiero que todas las páginas y componentes tengan traducciones completas en inglés y español, para poder usar el sistema en mi idioma preferido.

#### Acceptance Criteria

1. WHEN se accede a cualquier página admin THEN todas las etiquetas, botones y mensajes SHALL estar traducidos
2. WHEN se accede a la landing page THEN todo el contenido SHALL estar disponible en ambos idiomas
3. WHEN se accede a la página de login THEN el formulario y mensajes SHALL estar traducidos
4. WHEN se usan componentes de bag/cart/vault THEN todos los textos SHALL estar traducidos
5. WHEN se usan componentes de scanner THEN todas las etiquetas SHALL estar traducidas
6. WHEN se muestran mensajes de estado THEN todos los estados SHALL tener traducciones
7. WHEN se muestran mensajes de validación de formularios THEN todos los mensajes SHALL estar traducidos
8. IF una clave de traducción no existe THEN el sistema SHALL mostrar la clave como fallback para facilitar debugging

### Requirement 3: Actualizar Componentes para Usar Traducciones

**User Story:** Como desarrollador, quiero que todos los componentes usen el sistema de traducción de manera consistente, para mantener el código limpio y mantenible.

#### Acceptance Criteria

1. WHEN un componente tiene texto hardcodeado THEN el texto SHALL ser reemplazado por una llamada a `t(key)`
2. WHEN un componente necesita traducciones THEN el componente SHALL importar y usar `useLanguage()` hook
3. WHEN se actualiza un componente THEN el componente SHALL mantener su funcionalidad existente
4. WHEN se usan traducciones con variables THEN el sistema SHALL soportar interpolación de variables
5. IF un componente ya usa traducciones correctamente THEN el componente SHALL permanecer sin cambios

### Requirement 4: Páginas Admin - Traducciones Completas

**User Story:** Como administrador, quiero que todas las páginas de administración estén completamente traducidas, para poder gestionar el sistema en mi idioma preferido.

#### Acceptance Criteria

1. WHEN se accede a `/admin/tools` THEN toda la interfaz SHALL estar traducida
2. WHEN se accede a `/admin/users` THEN toda la interfaz SHALL estar traducida
3. WHEN se accede a `/admin/reports` THEN toda la interfaz SHALL estar traducida
4. WHEN se accede a `/admin/consumables` THEN toda la interfaz SHALL estar traducida
5. WHEN se accede a `/admin/loans` THEN toda la interfaz SHALL estar traducida
6. WHEN se accede a `/admin/audit` THEN toda la interfaz SHALL estar traducida
7. WHEN se accede a páginas de detalle (tools/[id], users/[id], etc.) THEN toda la interfaz SHALL estar traducida
8. WHEN se accede a formularios de creación (tools/new, users/new, etc.) THEN toda la interfaz SHALL estar traducida

### Requirement 5: Landing Page y Login - Traducciones

**User Story:** Como visitante del sitio, quiero que la landing page y el login estén disponibles en mi idioma, para entender mejor el sistema antes de usarlo.

#### Acceptance Criteria

1. WHEN se accede a la landing page THEN todos los componentes (Navigation, Hero, Features, Benefits, CTA, Footer) SHALL estar traducidos
2. WHEN se accede a la página de login THEN el formulario, labels y mensajes de error SHALL estar traducidos
3. WHEN se cambia el idioma en la landing page THEN todo el contenido SHALL actualizarse inmediatamente
4. WHEN se envía el formulario de login con errores THEN los mensajes de error SHALL mostrarse en el idioma seleccionado

### Requirement 6: Componentes Compartidos - Traducciones

**User Story:** Como usuario, quiero que todos los componentes compartidos (bag, cart, vault, scanner) estén traducidos, para tener una experiencia consistente en todo el sistema.

#### Acceptance Criteria

1. WHEN se usa el componente Bag THEN todos los textos (títulos, botones, mensajes) SHALL estar traducidos
2. WHEN se usa el componente Cart THEN todos los textos SHALL estar traducidos
3. WHEN se usa el componente Vault THEN todos los textos SHALL estar traducidos
4. WHEN se usan componentes de Scanner THEN todos los textos SHALL estar traducidos
5. WHEN se usa BulkImportConsumables THEN todos los textos SHALL estar traducidos
6. WHEN se muestran notificaciones o toasts THEN los mensajes SHALL estar traducidos

### Requirement 7: Validación y Testing

**User Story:** Como QA tester, quiero poder verificar que todas las traducciones funcionan correctamente, para asegurar la calidad del sistema.

#### Acceptance Criteria

1. WHEN se cambia el idioma en cualquier página THEN todos los textos visibles SHALL actualizarse inmediatamente
2. WHEN se navega entre páginas THEN el idioma seleccionado SHALL persistir
3. WHEN se recarga la página THEN el idioma seleccionado SHALL mantenerse (localStorage)
4. WHEN se busca una clave de traducción inexistente THEN el sistema SHALL mostrar la clave como texto para facilitar debugging
5. IF hay textos que no cambian al cambiar idioma THEN esos textos SHALL ser identificados y corregidos
6. WHEN se ejecutan pruebas visuales THEN no SHALL haber problemas de layout causados por textos más largos en español

### Requirement 8: Mejoras de UX en Selector de Idioma

**User Story:** Como usuario, quiero un selector de idioma visible y fácil de usar, para cambiar el idioma cuando lo necesite.

#### Acceptance Criteria

1. WHEN se accede al sistema THEN el selector de idioma SHALL ser visible en el header
2. WHEN se hace clic en el selector de idioma THEN el cambio SHALL ser inmediato
3. WHEN se selecciona un idioma THEN el sistema SHALL guardar la preferencia en localStorage
4. IF el usuario no ha seleccionado un idioma previamente THEN el sistema SHALL detectar el idioma del navegador
5. WHEN se muestra el selector THEN SHALL mostrar banderas o nombres claros de los idiomas

### Requirement 9: Formato de Fechas y Números Localizados

**User Story:** Como usuario, quiero que las fechas y números se muestren en el formato de mi idioma, para una mejor comprensión.

#### Acceptance Criteria

1. WHEN se muestran fechas THEN SHALL usar el formato apropiado para el idioma seleccionado (DD/MM/YYYY para español, MM/DD/YYYY para inglés)
2. WHEN se muestran números THEN SHALL usar el separador apropiado (coma para español, punto para inglés)
3. WHEN se muestran fechas relativas ("hace 2 días") THEN SHALL estar traducidas
4. IF se muestran monedas THEN SHALL usar el formato apropiado para el idioma

### Requirement 10: Documentación del Sistema de Traducción

**User Story:** Como desarrollador nuevo en el proyecto, quiero documentación clara sobre cómo usar el sistema de traducción, para poder agregar nuevas traducciones fácilmente.

#### Acceptance Criteria

1. WHEN se consulta la documentación THEN SHALL existir una guía de cómo agregar nuevas traducciones
2. WHEN se consulta la documentación THEN SHALL existir una convención de nombres para claves de traducción
3. WHEN se consulta la documentación THEN SHALL existir ejemplos de uso del hook `useLanguage()`
4. WHEN se consulta la documentación THEN SHALL existir una guía de cómo manejar traducciones con variables
5. WHEN se agrega una nueva página THEN la documentación SHALL explicar cómo implementar traducciones desde el inicio
