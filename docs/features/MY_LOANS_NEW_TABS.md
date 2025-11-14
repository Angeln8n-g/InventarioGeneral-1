# Nuevas Pestañas en Panel de Préstamos

## Resumen
Se han agregado dos nuevas pestañas a la página "Panel de Préstamos" para proporcionar más visibilidad sobre el inventario del sistema.

## Nuevas Funcionalidades

### 1. Pestaña "Préstamos Generales Activos" (All Active Loans)
**Ubicación**: `/my-loans` (Panel de Préstamos) → Pestaña "Préstamos Generales Activos"

**Descripción**: Muestra todos los préstamos activos del sistema, no solo los del usuario actual.

**Información mostrada**:
- Nombre de la herramienta
- Número de serie
- Usuario que tiene el préstamo (nombre completo o username)
- Fecha de préstamo
- Fecha de vencimiento
- Estado (Activo/Vencido)
- Notas (si existen)

**Endpoint**: `GET /api/loans/all-active`

**Características**:
- Ordenado por fecha de vencimiento (más próximos primero)
- Muestra solo préstamos con estado 'active' u 'overdue'
- Indicador visual de estado (amarillo para activo, rojo para vencido)

---

### 2. Pestaña "Herramientas Disponibles" (Available Tools)
**Ubicación**: `/my-loans` (Panel de Préstamos) → Pestaña "Herramientas Disponibles"

**Descripción**: Muestra un resumen de todas las herramientas disponibles en el almacén, agrupadas por tipo.

**Información mostrada**:
- Nombre del tipo de herramienta
- Descripción (si existe)
- Categoría (si existe)
- Cantidad disponible
- Total general de herramientas disponibles (en tarjeta resumen)

**Endpoint**: `GET /api/tools/available`

**Características**:
- ⭐ **Filtros por categoría**: Botones para filtrar herramientas por categoría
- Agrupación automática por tipo de herramienta
- Contador de unidades disponibles por tipo
- Tarjeta resumen con total de herramientas disponibles
- Diseño en grid responsive (1 columna en móvil, 2 en desktop)
- Ordenado alfabéticamente por nombre
- Botón "Todas" para mostrar todas las categorías

---

## Estructura de Pestañas Actualizada

1. **Mis Préstamos** - Préstamos activos del usuario actual
2. **Préstamos Generales Activos** ⭐ NUEVO - Todos los préstamos activos del sistema
3. **Herramientas Disponibles** ⭐ NUEVO - Inventario de herramientas disponibles con filtros por categoría
4. **Historial** - Historial de préstamos del usuario
5. **Consumibles** - Historial de consumibles del usuario

---

## Archivos Modificados

### Backend
- `src/app/api/loans/all-active/route.ts` - Nuevo endpoint para préstamos activos globales
- `src/app/api/tools/available/route.ts` - Nuevo endpoint para herramientas disponibles

### Frontend
- `src/services/api.ts` - Agregados hooks RTK Query:
  - `useGetAllActiveLoansQuery()`
  - `useGetAvailableToolsQuery()`
- `src/app/my-loans/page.tsx` - Agregadas nuevas pestañas y su contenido

---

## Beneficios

### Para Usuarios
- **Visibilidad completa**: Ver qué herramientas están prestadas y a quién
- **Disponibilidad rápida**: Saber qué herramientas están disponibles sin navegar a otras páginas
- **Mejor planificación**: Identificar cuándo se liberarán herramientas

### Para Administradores
- **Monitoreo centralizado**: Ver todos los préstamos activos en un solo lugar
- **Control de inventario**: Verificar rápidamente la disponibilidad de herramientas
- **Identificación de cuellos de botella**: Ver qué herramientas están más demandadas

---

## Filtros Implementados

### Filtro por Categoría (Pestaña Herramientas Disponibles)
- Botones dinámicos generados automáticamente según las categorías disponibles
- Botón "Todas" para mostrar todas las herramientas
- Filtrado en tiempo real sin necesidad de recargar
- Diseño responsive con wrap automático
- Indicador visual de categoría seleccionada (rojo Claro)

## Próximos Pasos Sugeridos

1. **Más Filtros**: Agregar filtros por usuario o fecha de vencimiento en "Todos los Préstamos"
2. **Búsqueda**: Implementar búsqueda por nombre de herramienta o usuario
3. **Exportación**: Permitir exportar los datos a CSV/Excel
4. **Notificaciones**: Alertas cuando herramientas específicas estén disponibles
5. **Reservas**: Sistema de reserva de herramientas que están prestadas

---

## Notas Técnicas

- Ambos endpoints requieren autenticación (middleware `withAuth`)
- Los datos se cachean por 3 minutos (180 segundos) en RTK Query
- Las consultas se invalidan automáticamente cuando hay cambios en préstamos o herramientas
- Diseño responsive con soporte para modo oscuro
- Uso de colores del tema Claro para consistencia visual
