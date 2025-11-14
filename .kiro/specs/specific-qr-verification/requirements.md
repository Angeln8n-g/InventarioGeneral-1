# Requirements Document - Verificación de QR Específico

## Introduction

Esta especificación describe una mejora al sistema de verificación por QR del almacén. En lugar de permitir que el usuario escanee cualquiera de los 5 códigos QR disponibles, el sistema seleccionará aleatoriamente un código específico que el usuario debe encontrar y escanear. Esto garantiza que el usuario realmente se desplace por el almacén y no simplemente escanee el código más cercano a la entrada.

## Glossary

- **Sistema de Verificación QR**: Sistema que valida la presencia física del usuario en el almacén mediante códigos QR
- **Código QR Requerido**: El código QR específico que el sistema solicita al usuario escanear
- **Reserva**: Solicitud de materiales consumibles que el usuario debe recoger
- **Usuario**: Persona que tiene una reserva activa y necesita confirmar su recogida
- **Almacén**: Espacio físico donde se almacenan los materiales y donde están ubicados los códigos QR

## Requirements

### Requirement 1: Selección Aleatoria de Código QR

**User Story:** Como administrador del sistema, quiero que se seleccione aleatoriamente un código QR específico para cada confirmación de recogida, para asegurar que los usuarios se desplacen por el almacén.

#### Acceptance Criteria

1. WHEN un usuario intenta confirmar una recogida de reserva, THE Sistema de Verificación QR SHALL seleccionar aleatoriamente uno de los 5 códigos QR activos del almacén
2. THE Sistema de Verificación QR SHALL mostrar al usuario la ubicación específica del código QR seleccionado
3. THE Sistema de Verificación QR SHALL mostrar al usuario la zona específica del código QR seleccionado
4. THE Sistema de Verificación QR SHALL rechazar cualquier código QR que no sea el código específicamente solicitado
5. THE Sistema de Verificación QR SHALL permitir al usuario cancelar y reintentar, lo cual generará una nueva selección aleatoria

### Requirement 2: Visualización Clara del Código Requerido

**User Story:** Como usuario, quiero ver claramente qué código QR debo escanear y dónde está ubicado, para poder encontrarlo fácilmente en el almacén.

#### Acceptance Criteria

1. THE Sistema de Verificación QR SHALL mostrar el nombre de la ubicación del código QR requerido en texto destacado
2. THE Sistema de Verificación QR SHALL mostrar un icono visual que represente la zona del código QR requerido
3. THE Sistema de Verificación QR SHALL mostrar una descripción de la ubicación del código QR requerido
4. THE Sistema de Verificación QR SHALL mantener visible la información del código requerido mientras el scanner esté activo
5. IF el usuario escanea un código incorrecto, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje indicando cuál era el código correcto

### Requirement 3: Validación Estricta del Código Escaneado

**User Story:** Como administrador del sistema, quiero que solo se acepte el código QR específicamente solicitado, para garantizar que el usuario visitó la ubicación correcta.

#### Acceptance Criteria

1. WHEN un usuario escanea un código QR, THE Sistema de Verificación QR SHALL validar que el código escaneado coincida exactamente con el código requerido
2. IF el código escaneado no coincide con el código requerido, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje de error específico
3. IF el código escaneado no coincide con el código requerido, THEN THE Sistema de Verificación QR SHALL indicar la ubicación del código correcto
4. IF el código escaneado coincide con el código requerido, THEN THE Sistema de Verificación QR SHALL proceder con la confirmación de la reserva
5. THE Sistema de Verificación QR SHALL registrar en la base de datos el código QR que fue solicitado y el código QR que fue escaneado

### Requirement 4: Registro de Auditoría Mejorado

**User Story:** Como administrador del sistema, quiero registrar tanto el código solicitado como el código escaneado, para poder auditar intentos incorrectos y patrones de uso.

#### Acceptance Criteria

1. THE Sistema de Verificación QR SHALL registrar el ID del código QR que fue solicitado al usuario
2. THE Sistema de Verificación QR SHALL registrar el ID del código QR que el usuario escaneó exitosamente
3. IF el usuario intenta escanear un código incorrecto, THEN THE Sistema de Verificación QR SHALL registrar el intento fallido en los logs de auditoría
4. THE Sistema de Verificación QR SHALL registrar la fecha y hora de cada intento de escaneo
5. THE Sistema de Verificación QR SHALL permitir consultar el historial de intentos de escaneo por usuario y por reserva

### Requirement 5: Manejo de Códigos QR Inactivos

**User Story:** Como administrador del sistema, quiero que el sistema solo seleccione códigos QR activos, para evitar solicitar códigos que no están disponibles.

#### Acceptance Criteria

1. THE Sistema de Verificación QR SHALL consultar solo códigos QR con estado `is_active = true`
2. IF no hay códigos QR activos disponibles, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje de error al usuario
3. IF no hay códigos QR activos disponibles, THEN THE Sistema de Verificación QR SHALL notificar al administrador del sistema
4. THE Sistema de Verificación QR SHALL excluir de la selección aleatoria cualquier código QR con estado `is_active = false`
5. THE Sistema de Verificación QR SHALL actualizar la lista de códigos disponibles cada vez que se inicia una nueva verificación

### Requirement 6: Opción de Entrada Manual con Validación

**User Story:** Como usuario, quiero poder ingresar manualmente el código QR si el scanner no funciona, pero solo si es el código correcto.

#### Acceptance Criteria

1. THE Sistema de Verificación QR SHALL proporcionar una opción de entrada manual del código QR
2. WHEN un usuario ingresa manualmente un código QR, THE Sistema de Verificación QR SHALL validar que coincida con el código requerido
3. IF el código ingresado manualmente no coincide con el código requerido, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje de error
4. IF el código ingresado manualmente coincide con el código requerido, THEN THE Sistema de Verificación QR SHALL proceder con la confirmación
5. THE Sistema de Verificación QR SHALL registrar si la confirmación fue mediante escaneo o entrada manual

### Requirement 7: Experiencia de Usuario Mejorada

**User Story:** Como usuario, quiero recibir retroalimentación clara sobre mi progreso, para saber si estoy en el camino correcto.

#### Acceptance Criteria

1. WHEN el scanner detecta un código QR, THE Sistema de Verificación QR SHALL proporcionar retroalimentación visual inmediata
2. IF el código escaneado es incorrecto, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje de error con vibración (si está disponible)
3. IF el código escaneado es correcto, THEN THE Sistema de Verificación QR SHALL mostrar un mensaje de éxito con vibración de confirmación
4. THE Sistema de Verificación QR SHALL mostrar un indicador de progreso durante la validación del código
5. THE Sistema de Verificación QR SHALL permitir al usuario ver nuevamente la ubicación del código requerido en cualquier momento

### Requirement 8: Reportes y Estadísticas Actualizados

**User Story:** Como administrador, quiero ver estadísticas sobre qué códigos son solicitados más frecuentemente y cuántos intentos fallidos hay, para optimizar la ubicación de los códigos.

#### Acceptance Criteria

1. THE Sistema de Verificación QR SHALL registrar cuántas veces cada código QR fue solicitado
2. THE Sistema de Verificación QR SHALL registrar cuántos intentos fallidos hubo por código QR
3. THE Sistema de Verificación QR SHALL calcular la tasa de éxito de escaneo por código QR
4. THE Sistema de Verificación QR SHALL incluir estas métricas en el reporte de reservas
5. THE Sistema de Verificación QR SHALL permitir filtrar reportes por código QR solicitado vs código QR escaneado

## Non-Functional Requirements

### Performance
- La selección aleatoria del código QR debe completarse en menos de 100ms
- La validación del código escaneado debe completarse en menos de 500ms
- El sistema debe soportar múltiples usuarios escaneando simultáneamente

### Security
- El código QR requerido no debe ser predecible o manipulable por el usuario
- Los intentos fallidos deben ser registrados para detectar posibles intentos de fraude
- La validación debe ser del lado del servidor, no solo del cliente

### Usability
- El mensaje indicando el código requerido debe ser claro y fácil de entender
- El usuario debe poder ver la ubicación requerida en todo momento
- Los mensajes de error deben ser específicos y útiles

### Compatibility
- Debe funcionar con el sistema de verificación QR existente
- Debe ser compatible con todos los navegadores soportados
- Debe funcionar tanto en dispositivos móviles como en desktop

## Constraints

- Debe mantener compatibilidad con reservas existentes que no tienen código QR específico
- No debe requerir cambios en los códigos QR físicos ya instalados
- Debe integrarse con el sistema de reportes existente
- La migración de base de datos debe ser reversible

## Assumptions

- Los 5 códigos QR están instalados y accesibles en el almacén
- Los usuarios tienen acceso físico a todas las zonas del almacén
- Los códigos QR están en buen estado y son escaneables
- Los usuarios entienden español y pueden leer las instrucciones
