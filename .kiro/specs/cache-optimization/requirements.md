# Requirements Document - Cache Optimization

## Introduction

Este proyecto tiene como objetivo eliminar las recargas manuales de página en la aplicación de inventario mediante la implementación completa de RTK Query para la gestión de caché y estado. Actualmente, los usuarios deben recargar manualmente las páginas después de realizar acciones como préstamos, devoluciones o consumo de consumibles, lo que resulta en una experiencia de usuario deficiente y flujos de trabajo ineficientes.

La solución implementará mutaciones RTK Query faltantes, migrará componentes que usan fetch manual, y configurará invalidación automática de caché para que todas las vistas se actualicen automáticamente después de cualquier acción.

## Requirements

### Requirement 1: API Service Mutations

**User Story:** Como desarrollador, quiero que todas las operaciones de mutación estén disponibles en el servicio API RTK Query, para que los componentes puedan usar hooks consistentes en lugar de fetch manual.

#### Acceptance Criteria

1. WHEN se crea un préstamo por lotes THEN el sistema SHALL proporcionar un hook `useCreateBatchLoansMutation` que invalide las tags ['Loan', 'Tool', 'Notification']
2. WHEN se consume un consumible THEN el sistema SHALL proporcionar un hook `useConsumeConsumableMutation` que invalide las tags ['Consumable', 'Notification']
3. WHEN se devuelve un consumible THEN el sistema SHALL proporcionar un hook `useReturnConsumableMutation` que invalide las tags ['Consumable']
4. WHEN se consulta el historial de consumos THEN el sistema SHALL proporcionar un hook `useGetMyConsumptionsQuery` que provea la tag ['Consumable']
5. IF una mutación es exitosa THEN el sistema SHALL invalidar automáticamente las tags correspondientes para refrescar los datos en caché
6. WHEN se define una mutación THEN el sistema SHALL incluir tipos TypeScript completos para request y response

### Requirement 2: Component Migration to RTK Query

**User Story:** Como desarrollador, quiero que todos los componentes usen RTK Query en lugar de fetch manual, para que la gestión de caché y estado sea consistente en toda la aplicación.

#### Acceptance Criteria

1. WHEN el usuario escanea herramientas en `/tools/scan` THEN el componente SHALL usar `useCreateBatchLoansMutation` en lugar de fetch manual
2. WHEN el usuario devuelve herramientas en `/tools/return` THEN el componente SHALL usar `useReturnToolMutation` en lugar de fetch manual
3. WHEN el usuario consume consumibles en `/consumables/scan` THEN el componente SHALL usar `useConsumeConsumableMutation` en lugar de fetch manual
4. WHEN el usuario devuelve consumibles en `/consumables/return` THEN el componente SHALL usar `useReturnConsumableMutation` en lugar de fetch manual
5. WHEN el usuario ve sus consumos en `/my-loans` THEN el componente SHALL usar `useGetMyConsumptionsQuery` en lugar de useEffect con fetch
6. IF un componente usa una mutación THEN el sistema SHALL usar los estados `isLoading`, `isError`, y `isSuccess` del hook en lugar de estado local
7. WHEN una mutación falla THEN el componente SHALL mostrar el error usando la respuesta del hook en lugar de manejo manual

### Requirement 3: Automatic Cache Invalidation

**User Story:** Como usuario, quiero que todas las vistas se actualicen automáticamente después de realizar acciones, para que no tenga que recargar manualmente la página.

#### Acceptance Criteria

1. WHEN se crea un préstamo THEN el dashboard SHALL actualizarse automáticamente sin recarga manual
2. WHEN se devuelve una herramienta THEN la página "Mis Préstamos" SHALL actualizarse automáticamente sin recarga manual
3. WHEN se consume un consumible THEN la lista de consumibles SHALL actualizarse automáticamente sin recarga manual
4. WHEN se devuelve un consumible THEN la lista de consumibles y el historial SHALL actualizarse automáticamente sin recarga manual
5. IF una mutación invalida tags THEN todas las queries que proveen esas tags SHALL refetchearse automáticamente
6. WHEN el usuario navega después de una mutación THEN los datos SHALL estar actualizados sin necesidad de refetch manual

### Requirement 4: Loading and Error States

**User Story:** Como usuario, quiero ver indicadores de carga claros y mensajes de error informativos, para que entienda el estado de mis acciones.

#### Acceptance Criteria

1. WHEN una mutación está en progreso THEN el sistema SHALL mostrar un indicador de carga visual
2. WHEN una mutación es exitosa THEN el sistema SHALL mostrar un mensaje de confirmación
3. IF una mutación falla THEN el sistema SHALL mostrar un mensaje de error descriptivo
4. WHEN una query está cargando THEN el sistema SHALL mostrar un skeleton o spinner apropiado
5. IF una query falla THEN el sistema SHALL mostrar un mensaje de error con opción de reintentar
6. WHEN el usuario realiza múltiples acciones rápidas THEN el sistema SHALL manejar correctamente los estados de carga concurrentes

### Requirement 5: Performance Optimization

**User Story:** Como usuario, quiero que la aplicación responda rápidamente y no haga peticiones innecesarias, para que mi experiencia sea fluida y eficiente.

#### Acceptance Criteria

1. WHEN se configura una query THEN el sistema SHALL establecer un `keepUnusedDataFor` apropiado basado en la volatilidad de los datos
2. IF los datos están en caché y son recientes THEN el sistema SHALL usar los datos en caché en lugar de hacer una nueva petición
3. WHEN se navega entre páginas THEN el sistema SHALL reutilizar datos en caché cuando sea apropiado
4. IF una query necesita datos en tiempo real THEN el sistema SHALL configurar `pollingInterval` apropiado
5. WHEN la ventana no está enfocada THEN el sistema SHALL pausar el polling usando `skipPollingIfUnfocused: true`
6. WHEN se completa la migración THEN el tiempo de carga de páginas SHALL ser igual o mejor que antes

### Requirement 6: Code Quality and Maintainability

**User Story:** Como desarrollador, quiero que el código sea limpio y bien documentado, para que sea fácil mantener y extender en el futuro.

#### Acceptance Criteria

1. WHEN se implementa una mutación THEN el código SHALL incluir comentarios JSDoc descriptivos
2. WHEN se migra un componente THEN el código antiguo con fetch manual SHALL ser eliminado
3. IF se crea un patrón reutilizable THEN el sistema SHALL documentarlo en una guía de desarrollador
4. WHEN se completa la migración THEN el sistema SHALL tener documentación actualizada sobre cómo agregar nuevas mutaciones
5. WHEN se implementa invalidación de caché THEN el patrón SHALL estar documentado con ejemplos
6. IF existe código comentado o deprecado THEN el sistema SHALL eliminarlo durante la limpieza

### Requirement 7: Testing and Validation

**User Story:** Como desarrollador, quiero que todas las funcionalidades estén probadas, para que pueda confiar en que el sistema funciona correctamente.

#### Acceptance Criteria

1. WHEN se completa cada fase THEN el sistema SHALL ser probado end-to-end antes de continuar
2. WHEN se crea un préstamo THEN el flujo completo SHALL ser probado desde el escaneo hasta la actualización del dashboard
3. WHEN se devuelve una herramienta THEN el flujo completo SHALL ser probado desde la devolución hasta la actualización de "Mis Préstamos"
4. WHEN se consume un consumible THEN el flujo completo SHALL ser probado desde el escaneo hasta la actualización de la lista
5. IF ocurre un error de red THEN el sistema SHALL manejar el error correctamente y mostrar un mensaje apropiado
6. WHEN se prueba en diferentes navegadores THEN el sistema SHALL funcionar correctamente en Chrome, Firefox, Safari y navegadores móviles

### Requirement 8: Optimistic Updates (Optional Enhancement)

**User Story:** Como usuario, quiero ver actualizaciones instantáneas en la UI cuando realizo acciones, para que la aplicación se sienta más rápida y responsiva.

#### Acceptance Criteria

1. WHEN se devuelve una herramienta THEN la UI SHALL actualizarse optimísticamente antes de recibir confirmación del servidor
2. IF una actualización optimística falla THEN el sistema SHALL revertir los cambios y mostrar un error
3. WHEN se crea un préstamo THEN la UI SHALL mostrar el préstamo inmediatamente con un indicador de "pendiente"
4. WHEN se consume un consumible THEN el stock SHALL actualizarse optimísticamente en la UI
5. IF el servidor rechaza una actualización optimística THEN el sistema SHALL restaurar el estado anterior sin pérdida de datos

## Success Criteria

El proyecto será considerado exitoso cuando:

1. ✅ No se requieran recargas manuales de página después de ninguna acción
2. ✅ El dashboard se actualice automáticamente después de acciones de préstamo/devolución
3. ✅ La página "Mis Préstamos" se actualice automáticamente
4. ✅ La lista de consumibles se actualice automáticamente
5. ✅ Todos los estados de carga funcionen correctamente
6. ✅ Todo el manejo de errores funcione correctamente
7. ✅ El rendimiento sea igual o mejor que antes
8. ✅ El código sea más limpio y mantenible
9. ✅ Todos los flujos pasen las pruebas end-to-end
10. ✅ La documentación esté completa y actualizada
