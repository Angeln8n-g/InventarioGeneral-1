# Requirements Document

## Introduction

Esta funcionalidad mejorará significativamente la experiencia del usuario al permitir escanear múltiples herramientas o consumibles de forma consecutiva, creando una lista de elementos antes de confirmar la acción final. Esto es especialmente útil cuando un usuario necesita tomar prestadas varias herramientas a la vez o devolver múltiples elementos, eliminando la necesidad de repetir el proceso de escaneo individual para cada elemento.

El sistema actual requiere que el usuario escanee un elemento, confirme la acción, y luego regrese al scanner para el siguiente elemento. Con esta mejora, el usuario podrá escanear todos los elementos necesarios, revisarlos en una lista, y confirmar todas las acciones de una sola vez.

## Requirements

### Requirement 1: Modo de Escaneo Múltiple para Préstamos

**User Story:** Como usuario del sistema, quiero poder escanear múltiples herramientas consecutivamente antes de confirmar el préstamo, para poder tomar prestadas varias herramientas en una sola operación.

#### Acceptance Criteria

1. WHEN el usuario accede al scanner en modo "loan" THEN el sistema SHALL mostrar una opción para activar el "Modo de Escaneo Múltiple"
2. WHEN el usuario activa el modo de escaneo múltiple THEN el sistema SHALL mantener el scanner activo después de cada escaneo exitoso
3. WHEN el usuario escanea un código QR válido en modo múltiple THEN el sistema SHALL agregar la herramienta a una lista visible sin cerrar el scanner
4. WHEN se agrega una herramienta a la lista THEN el sistema SHALL mostrar el nombre, número de serie, y estado de disponibilidad de la herramienta
5. WHEN el usuario escanea una herramienta que ya está en la lista THEN el sistema SHALL mostrar un mensaje de advertencia indicando que el elemento ya fue escaneado
6. WHEN el usuario escanea una herramienta no disponible para préstamo THEN el sistema SHALL mostrar un error y NO agregarla a la lista
7. WHEN la lista contiene al menos un elemento THEN el sistema SHALL mostrar un botón "Confirmar Préstamos" con el contador de elementos
8. WHEN el usuario hace clic en "Confirmar Préstamos" THEN el sistema SHALL crear préstamos para todas las herramientas de la lista en una sola transacción

### Requirement 2: Modo de Escaneo Múltiple para Devoluciones

**User Story:** Como usuario del sistema, quiero poder escanear múltiples herramientas consecutivamente antes de confirmar la devolución, para poder devolver varias herramientas en una sola operación.

#### Acceptance Criteria

1. WHEN el usuario accede al scanner en modo "return" THEN el sistema SHALL mostrar una opción para activar el "Modo de Escaneo Múltiple"
2. WHEN el usuario activa el modo de escaneo múltiple para devoluciones THEN el sistema SHALL mantener el scanner activo después de cada escaneo exitoso
3. WHEN el usuario escanea un código QR válido en modo múltiple de devolución THEN el sistema SHALL verificar que la herramienta esté prestada al usuario actual
4. WHEN la herramienta está prestada al usuario THEN el sistema SHALL agregarla a la lista de devoluciones pendientes
5. WHEN la herramienta NO está prestada al usuario THEN el sistema SHALL mostrar un error y NO agregarla a la lista
6. WHEN la lista de devoluciones contiene al menos un elemento THEN el sistema SHALL mostrar un botón "Confirmar Devoluciones" con el contador de elementos
7. WHEN el usuario hace clic en "Confirmar Devoluciones" THEN el sistema SHALL procesar todas las devoluciones en una sola transacción

### Requirement 3: Gestión de Lista de Elementos Escaneados

**User Story:** Como usuario del sistema, quiero poder ver, revisar y gestionar la lista de elementos escaneados antes de confirmar, para asegurarme de que todos los elementos son correctos.

#### Acceptance Criteria

1. WHEN hay elementos en la lista THEN el sistema SHALL mostrar una lista visual con todos los elementos escaneados
2. WHEN se muestra un elemento en la lista THEN el sistema SHALL incluir: nombre, número de serie, estado, y un botón para remover
3. WHEN el usuario hace clic en el botón de remover THEN el sistema SHALL eliminar ese elemento de la lista sin afectar los demás
4. WHEN el usuario remueve todos los elementos THEN el sistema SHALL ocultar el botón de confirmación
5. WHEN hay elementos en la lista THEN el sistema SHALL mostrar un contador visible del total de elementos
6. WHEN el usuario está escaneando THEN el sistema SHALL mostrar la lista de elementos ya escaneados debajo o al lado del scanner
7. WHEN el usuario cancela el modo múltiple THEN el sistema SHALL preguntar confirmación si hay elementos en la lista

### Requirement 4: Modo de Escaneo Múltiple para Consumibles

**User Story:** Como usuario del sistema, quiero poder escanear múltiples consumibles consecutivamente y especificar cantidades, para poder registrar el consumo de varios materiales en una sola operación.

#### Acceptance Criteria

1. WHEN el usuario accede al scanner de consumibles THEN el sistema SHALL mostrar una opción para activar el "Modo de Escaneo Múltiple"
2. WHEN el usuario escanea un consumible en modo múltiple THEN el sistema SHALL agregarlo a la lista y solicitar la cantidad consumida
3. WHEN el usuario especifica una cantidad THEN el sistema SHALL validar que no exceda el stock disponible
4. WHEN el usuario escanea el mismo consumible múltiples veces THEN el sistema SHALL acumular las cantidades en lugar de crear entradas duplicadas
5. WHEN la lista contiene consumibles THEN el sistema SHALL mostrar nombre, cantidad a consumir, y stock disponible
6. WHEN el usuario confirma el consumo múltiple THEN el sistema SHALL procesar todos los consumos en una sola transacción

### Requirement 5: Interfaz de Usuario y Experiencia

**User Story:** Como usuario del sistema, quiero una interfaz clara e intuitiva para el modo de escaneo múltiple, para poder usarlo fácilmente sin confusión.

#### Acceptance Criteria

1. WHEN el usuario accede al scanner THEN el sistema SHALL mostrar claramente la opción de modo simple vs modo múltiple
2. WHEN el modo múltiple está activo THEN el sistema SHALL mostrar un indicador visual claro (badge, color, icono)
3. WHEN el usuario escanea un elemento exitosamente THEN el sistema SHALL mostrar una animación o feedback visual de confirmación
4. WHEN ocurre un error al escanear THEN el sistema SHALL mostrar el error sin cerrar el scanner ni limpiar la lista
5. WHEN la lista está vacía THEN el sistema SHALL mostrar un mensaje indicando "Escanea elementos para comenzar"
6. WHEN hay elementos en la lista THEN el sistema SHALL permitir scroll si la lista es muy larga
7. WHEN el usuario confirma la operación THEN el sistema SHALL mostrar un indicador de progreso durante el procesamiento
8. WHEN la operación se completa exitosamente THEN el sistema SHALL mostrar un resumen de elementos procesados antes de redirigir

### Requirement 6: Manejo de Errores y Validaciones

**User Story:** Como usuario del sistema, quiero que el sistema maneje errores de forma clara durante el escaneo múltiple, para entender qué elementos tienen problemas sin perder mi progreso.

#### Acceptance Criteria

1. WHEN un elemento no se puede agregar a la lista THEN el sistema SHALL mostrar el error específico sin limpiar la lista existente
2. WHEN falla la confirmación de algunos elementos THEN el sistema SHALL mostrar qué elementos fallaron y cuáles tuvieron éxito
3. WHEN hay un error de red durante la confirmación THEN el sistema SHALL mantener la lista y permitir reintentar
4. WHEN el usuario pierde conexión durante el escaneo THEN el sistema SHALL mantener la lista en memoria y permitir continuar cuando se recupere la conexión
5. WHEN un elemento ya no está disponible al momento de confirmar THEN el sistema SHALL notificar al usuario y permitir removerlo de la lista
6. WHEN ocurre un error crítico THEN el sistema SHALL ofrecer la opción de guardar la lista para reintentarlo después

### Requirement 7: Persistencia y Recuperación

**User Story:** Como usuario del sistema, quiero que mi lista de elementos escaneados se preserve si accidentalmente salgo del scanner, para no perder mi progreso.

#### Acceptance Criteria

1. WHEN el usuario tiene elementos en la lista THEN el sistema SHALL guardar la lista en localStorage automáticamente
2. WHEN el usuario regresa al scanner THEN el sistema SHALL ofrecer restaurar la lista guardada si existe
3. WHEN el usuario confirma exitosamente THEN el sistema SHALL limpiar la lista guardada en localStorage
4. WHEN el usuario cancela explícitamente THEN el sistema SHALL limpiar la lista guardada en localStorage
5. WHEN la lista guardada tiene más de 24 horas THEN el sistema SHALL descartarla automáticamente

### Requirement 8: Optimización de Rendimiento

**User Story:** Como usuario del sistema, quiero que el escaneo múltiple sea rápido y eficiente, para poder procesar muchos elementos sin demoras.

#### Acceptance Criteria

1. WHEN el usuario escanea un elemento THEN el sistema SHALL validarlo y agregarlo a la lista en menos de 1 segundo
2. WHEN el usuario confirma múltiples elementos THEN el sistema SHALL procesarlos en paralelo cuando sea posible
3. WHEN hay más de 10 elementos en la lista THEN el sistema SHALL implementar virtualización para mantener el rendimiento
4. WHEN se procesa la confirmación THEN el sistema SHALL mostrar progreso en tiempo real (ej: "Procesando 3 de 10")
5. WHEN falla un elemento durante la confirmación THEN el sistema SHALL continuar procesando los demás sin detenerse
