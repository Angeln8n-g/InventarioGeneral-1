# Requirements Document

## Introduction

El sistema actualmente tiene dos páginas de consumibles con funcionalidades superpuestas que causan confusión y duplicación de código:

1. **`/consumables/page.tsx`** - Página de solicitud de consumibles para usuarios regulares (Request Supplies)
2. **`/admin/consumables/page.tsx`** - Página de gestión de consumibles para administradores (Consumables Management)

Ambas páginas muestran inventario de consumibles, permiten búsqueda y filtrado, y tienen interfaces similares pero con diferentes niveles de acceso. Esta duplicación genera:

- **Confusión de usuarios**: No está claro cuál página usar
- **Mantenimiento duplicado**: Cambios deben hacerse en dos lugares
- **Inconsistencias de UX**: Las interfaces no están completamente alineadas
- **Código redundante**: Lógica de filtrado y visualización duplicada

El objetivo es unificar estas páginas en una solución coherente que:

- Mantenga la separación de permisos (usuarios vs administradores)
- Elimine la duplicación de código
- Proporcione una experiencia de usuario clara y consistente
- Preserve todas las funcionalidades existentes

## Requirements

### Requirement 1: Análisis y Documentación de Funcionalidades Actuales

**User Story:** Como desarrollador, quiero un análisis completo de las funcionalidades de ambas páginas, para entender qué debe preservarse y qué puede consolidarse.

#### Acceptance Criteria

1. WHEN se analiza `/consumables/page.tsx` THEN el sistema SHALL documentar todas las funcionalidades específicas de usuarios regulares:

   - Visualización de inventario disponible
   - Solicitud de materiales con carrito de compras
   - Filtros por categoría, búsqueda y stock bajo
   - Botón de devolución de materiales
   - Tarjetas de resumen (Total Items, Available, Low Stock, Out of Stock)

2. WHEN se analiza `/admin/consumables/page.tsx` THEN el sistema SHALL documentar todas las funcionalidades específicas de administradores:

   - Gestión completa de inventario
   - Ajuste de stock (adjust, set, restock)
   - Vista de backorders/pedidos pendientes
   - Importación masiva de consumibles
   - Escaneo de códigos QR
   - Gestión de tipos de items
   - Filtros avanzados con contador de resultados

3. WHEN se comparan ambas páginas THEN el sistema SHALL identificar:
   - Funcionalidades compartidas (búsqueda, filtros, visualización)
   - Funcionalidades únicas de cada rol
   - Componentes que pueden reutilizarse
   - Diferencias en la UI/UX

### Requirement 2: Estrategia de Unificación

**User Story:** Como arquitecto de software, quiero definir una estrategia clara de unificación, para que la solución sea mantenible y escalable.

#### Acceptance Criteria

1. WHEN se define la estrategia THEN el sistema SHALL elegir entre:

   - **Opción A**: Una sola página con renderizado condicional basado en rol
   - **Opción B**: Páginas separadas con componentes compartidos
   - **Opción C**: Página base común con extensiones específicas por rol

2. IF se elige una estrategia THEN el sistema SHALL documentar:

   - Ventajas y desventajas de la opción elegida
   - Impacto en rutas y navegación existentes
   - Plan de migración de código
   - Estrategia de testing

3. WHEN se define la arquitectura THEN el sistema SHALL especificar:
   - Estructura de componentes compartidos
   - Manejo de permisos y roles
   - Gestión de estado compartido vs específico
   - Patrones de composición a utilizar

### Requirement 3: Diseño de Componentes Compartidos

**User Story:** Como desarrollador frontend, quiero componentes reutilizables bien diseñados, para reducir la duplicación y facilitar el mantenimiento.

#### Acceptance Criteria

1. WHEN se diseñan componentes compartidos THEN el sistema SHALL crear:

   - `ConsumableCard` - Tarjeta de visualización de consumible (adaptable por rol)
   - `ConsumableFilters` - Sistema de filtros (búsqueda, categoría, stock)
   - `ConsumableSummary` - Tarjetas de resumen estadístico
   - `ConsumableList` - Lista/grid de consumibles con paginación

2. WHEN se diseña cada componente THEN el sistema SHALL definir:

   - Props interface con tipos TypeScript
   - Variantes por rol (user/admin)
   - Estados de carga y error
   - Accesibilidad (ARIA labels, keyboard navigation)

3. IF un componente necesita comportamiento específico por rol THEN el sistema SHALL:
   - Usar props para controlar la variante
   - Mantener la lógica de negocio separada
   - Documentar las diferencias claramente

### Requirement 4: Gestión de Permisos y Rutas

**User Story:** Como usuario del sistema, quiero acceder solo a las funcionalidades apropiadas para mi rol, para mantener la seguridad y claridad del sistema.

#### Acceptance Criteria

1. WHEN un usuario regular accede a la página THEN el sistema SHALL:

   - Mostrar solo funcionalidades de solicitud de materiales
   - Ocultar opciones administrativas (ajuste de stock, backorders, etc.)
   - Permitir agregar items al carrito
   - Mostrar botón de devolución de materiales

2. WHEN un administrador accede a la página THEN el sistema SHALL:

   - Mostrar todas las funcionalidades administrativas
   - Incluir tabs para Inventory y Backorders
   - Permitir ajuste de stock y gestión avanzada
   - Mostrar botones de importación masiva y gestión de tipos

3. IF se mantienen rutas separadas THEN el sistema SHALL:

   - Preservar `/consumables` para usuarios regulares
   - Preservar `/admin/consumables` para administradores
   - Redirigir apropiadamente según rol
   - Mantener compatibilidad con enlaces existentes

4. IF se unifica en una sola ruta THEN el sistema SHALL:
   - Detectar el rol del usuario automáticamente
   - Renderizar la vista apropiada sin redirección
   - Mantener URLs limpias y semánticas

### Requirement 5: Preservación de Funcionalidades Críticas

**User Story:** Como usuario del sistema, quiero que todas las funcionalidades actuales sigan funcionando después de la unificación, para no perder capacidades existentes.

#### Acceptance Criteria

1. WHEN se implementa la unificación THEN el sistema SHALL preservar para usuarios regulares:

   - Sistema de carrito de compras con CartContext
   - Solicitud individual y masiva de materiales
   - Botones de cantidad rápida (1, 5, 10)
   - Controles +/- para ajustar cantidad
   - Validación de stock disponible
   - Feedback visual de éxito/error
   - Botón flotante de devolución de materiales

2. WHEN se implementa la unificación THEN el sistema SHALL preservar para administradores:

   - Ajuste de stock (adjust, set, restock)
   - Vista de backorders con procesamiento
   - Importación masiva (BulkImportConsumables)
   - Escaneo de códigos QR
   - Navegación a gestión de tipos de items
   - Filtros avanzados con resumen de filtros activos
   - Contador de resultados filtrados

3. WHEN se migra funcionalidad THEN el sistema SHALL:
   - Mantener las mismas APIs y endpoints
   - Preservar el comportamiento de refetch después de acciones
   - Mantener los mensajes de éxito/error existentes
   - No romper integraciones existentes

### Requirement 6: Mejoras de UX y Consistencia

**User Story:** Como usuario del sistema, quiero una experiencia consistente y mejorada, para trabajar más eficientemente.

#### Acceptance Criteria

1. WHEN se unifica la UI THEN el sistema SHALL:

   - Usar el mismo sistema de diseño (Claro theme)
   - Mantener consistencia en colores de estado (green=disponible, yellow=bajo stock, red=sin stock)
   - Usar iconografía consistente
   - Aplicar el mismo estilo de tarjetas y layouts

2. WHEN se muestran filtros THEN el sistema SHALL:

   - Usar el mismo componente de filtros en ambos roles
   - Mostrar resumen de filtros activos con badges
   - Incluir botón "Clear All" cuando hay filtros activos
   - Mostrar contador de resultados

3. WHEN se muestran consumibles THEN el sistema SHALL:
   - Usar grid responsive (2 columnas en móvil, más en desktop)
   - Mostrar estado de carga con spinner
   - Mostrar estado vacío con mensaje apropiado
   - Incluir opción de limpiar filtros si no hay resultados

### Requirement 7: Testing y Validación

**User Story:** Como QA engineer, quiero tests completos que validen la unificación, para asegurar que no se introduzcan regresiones.

#### Acceptance Criteria

1. WHEN se implementa la unificación THEN el sistema SHALL incluir tests para:

   - Renderizado correcto según rol de usuario
   - Funcionalidad de filtros y búsqueda
   - Acciones de solicitud de materiales (usuarios)
   - Acciones de ajuste de stock (administradores)
   - Navegación y rutas

2. WHEN se ejecutan tests THEN el sistema SHALL validar:

   - Permisos y restricciones por rol
   - Integración con CartContext
   - Llamadas a API correctas
   - Estados de carga y error
   - Accesibilidad básica

3. IF se encuentran bugs THEN el sistema SHALL:
   - Documentar el issue claramente
   - Incluir pasos para reproducir
   - Proponer solución
   - Verificar con test adicional

### Requirement 8: Documentación y Migración

**User Story:** Como miembro del equipo, quiero documentación clara del cambio, para entender la nueva arquitectura y facilitar el mantenimiento futuro.

#### Acceptance Criteria

1. WHEN se completa la unificación THEN el sistema SHALL documentar:

   - Arquitectura de componentes resultante
   - Decisiones de diseño tomadas
   - Guía de uso para desarrolladores
   - Cambios en rutas y navegación

2. WHEN se migra código THEN el sistema SHALL:

   - Crear un plan de migración paso a paso
   - Identificar código a deprecar
   - Mantener compatibilidad durante transición
   - Documentar breaking changes si los hay

3. IF hay cambios en la API THEN el sistema SHALL:
   - Documentar endpoints afectados
   - Actualizar ejemplos de uso
   - Notificar a stakeholders
   - Mantener versionado apropiado

## Success Criteria

La unificación será exitosa cuando:

1. ✅ Exista una arquitectura clara con componentes compartidos bien definidos
2. ✅ Usuarios regulares puedan solicitar materiales sin ver opciones administrativas
3. ✅ Administradores tengan acceso completo a gestión de inventario
4. ✅ No exista duplicación significativa de código entre páginas
5. ✅ La experiencia de usuario sea consistente y mejorada
6. ✅ Todos los tests pasen exitosamente
7. ✅ La documentación esté completa y actualizada
8. ✅ El código sea más mantenible que la versión anterior

## Out of Scope

- Cambios en la lógica de negocio o APIs backend
- Nuevas funcionalidades no presentes en ninguna de las páginas actuales
- Rediseño completo de la UI (solo unificación y mejoras menores)
- Migración de otros módulos del sistema
- Cambios en el sistema de autenticación o roles
