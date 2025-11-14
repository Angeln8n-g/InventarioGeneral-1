# Requirements Document

## Introduction

Este documento define los requisitos para el sistema de gestión de electrónicos dentro del panel de administración. El sistema permitirá a los administradores gestionar dispositivos electrónicos con información detallada sobre sus componentes, especificaciones técnicas y estado. Los electrónicos se gestionarán como una categoría especializada de herramientas con atributos adicionales específicos para dispositivos tecnológicos.

## Glossary

- **Electronics Management System**: Sistema de gestión de dispositivos electrónicos que permite registrar, actualizar y consultar información detallada de equipos tecnológicos
- **Electronic Device**: Dispositivo tecnológico registrado en el sistema con información de hardware, software y estado
- **Component**: Parte física de un dispositivo electrónico (procesador, RAM, almacenamiento, etc.)
- **Specification**: Característica técnica de un componente (modelo, capacidad, velocidad, etc.)
- **Device Status**: Estado actual del dispositivo (disponible, prestado, en reparación, fuera de servicio, perdido, dañado)
- **Admin Panel**: Panel de administración donde los usuarios con rol admin pueden gestionar el inventario
- **QR Code**: Código único de identificación para cada dispositivo electrónico
- **Item Type**: Tipo de elemento en el sistema que puede ser herramienta o consumible
- **Tool Instance**: Instancia específica de una herramienta en el inventario

## Requirements

### Requirement 1

**User Story:** Como administrador, quiero poder registrar nuevos dispositivos electrónicos con información detallada de sus componentes, para mantener un inventario completo de los equipos tecnológicos.

#### Acceptance Criteria

1. WHEN el administrador accede a la sección de electrónicos, THE Electronics Management System SHALL mostrar una interfaz para crear nuevos dispositivos
2. WHEN el administrador completa el formulario de registro, THE Electronics Management System SHALL validar que todos los campos obligatorios estén presentes (nombre, categoría)
3. WHEN el administrador guarda un nuevo dispositivo, THE Electronics Management System SHALL generar automáticamente un código QR único
4. THE Electronics Management System SHALL permitir registrar la siguiente información: nombre, categoría, descripción, marca, modelo, número de serie, estado y notas de condición
5. WHEN el registro es exitoso, THE Electronics Management System SHALL mostrar una confirmación y actualizar la lista de dispositivos

### Requirement 2

**User Story:** Como administrador, quiero poder visualizar todos los dispositivos electrónicos registrados con sus especificaciones principales, para tener una vista general del inventario tecnológico.

#### Acceptance Criteria

1. WHEN el administrador accede a la sección de electrónicos, THE Electronics Management System SHALL mostrar una lista de todos los dispositivos registrados
2. THE Electronics Management System SHALL mostrar para cada dispositivo: nombre, categoría, marca, modelo, número de serie y estado
3. WHEN el administrador aplica filtros de búsqueda, THE Electronics Management System SHALL actualizar la lista mostrando solo los dispositivos que coincidan con los criterios
4. THE Electronics Management System SHALL permitir filtrar por: nombre, categoría, marca, modelo y estado
5. WHEN la lista está vacía, THE Electronics Management System SHALL mostrar un mensaje indicando que no hay dispositivos registrados

### Requirement 3

**User Story:** Como administrador, quiero poder editar la información de un dispositivo electrónico existente, para mantener actualizado el inventario cuando se realicen cambios o mejoras.

#### Acceptance Criteria

1. WHEN el administrador selecciona un dispositivo, THE Electronics Management System SHALL mostrar un formulario con la información actual del dispositivo
2. THE Electronics Management System SHALL permitir modificar la información básica del dispositivo (nombre, categoría, descripción, marca, modelo, número de serie, notas de condición)
3. WHEN el administrador guarda los cambios, THE Electronics Management System SHALL validar la información antes de actualizar
4. WHEN la actualización es exitosa, THE Electronics Management System SHALL mostrar una confirmación y reflejar los cambios en la lista
5. THE Electronics Management System SHALL mantener un registro de auditoría de los cambios realizados

### Requirement 4

**User Story:** Como administrador, quiero poder cambiar el estado de un dispositivo electrónico, para reflejar su disponibilidad actual en el sistema.

#### Acceptance Criteria

1. THE Electronics Management System SHALL permitir los siguientes estados: disponible, prestado, en reparación, fuera de servicio, perdido y dañado
2. WHEN el administrador cambia el estado de un dispositivo, THE Electronics Management System SHALL actualizar el estado inmediatamente
3. WHEN un dispositivo está prestado, THE Electronics Management System SHALL mostrar información del préstamo activo
4. WHEN el estado cambia a "en reparación" o "dañado", THE Electronics Management System SHALL permitir agregar notas sobre la condición
5. THE Electronics Management System SHALL registrar cada cambio de estado en el historial de auditoría

### Requirement 5

**User Story:** Como administrador, quiero poder eliminar dispositivos electrónicos del sistema, para mantener el inventario limpio y actualizado.

#### Acceptance Criteria

1. WHEN el administrador solicita eliminar un dispositivo, THE Electronics Management System SHALL mostrar una confirmación antes de proceder
2. IF el dispositivo tiene un préstamo activo, THEN THE Electronics Management System SHALL prevenir la eliminación y mostrar un mensaje de advertencia
3. WHEN la eliminación es confirmada, THE Electronics Management System SHALL remover el dispositivo del inventario
4. THE Electronics Management System SHALL registrar la eliminación en el historial de auditoría
5. WHEN la eliminación es exitosa, THE Electronics Management System SHALL mostrar una confirmación y actualizar la lista

### Requirement 6

**User Story:** Como administrador, quiero poder ver información detallada de un dispositivo electrónico específico, para consultar todas sus especificaciones y estado actual.

#### Acceptance Criteria

1. WHEN el administrador selecciona un dispositivo, THE Electronics Management System SHALL mostrar una vista detallada con toda la información
2. THE Electronics Management System SHALL mostrar: información básica (nombre, categoría, descripción), detalles del dispositivo (marca, modelo, número de serie), estado y notas de condición
3. WHEN el dispositivo tiene un préstamo activo, THE Electronics Management System SHALL mostrar los detalles del préstamo
4. THE Electronics Management System SHALL mostrar el código QR del dispositivo para facilitar su identificación
5. THE Electronics Management System SHALL permitir navegar de regreso a la lista de dispositivos

### Requirement 7

**User Story:** Como administrador, quiero que los dispositivos electrónicos se integren con el sistema de préstamos existente, para poder prestar y devolver equipos usando el mismo flujo que las herramientas.

#### Acceptance Criteria

1. WHEN un dispositivo electrónico es registrado, THE Electronics Management System SHALL crear una instancia de herramienta (Tool Instance) asociada
2. THE Electronics Management System SHALL permitir que los dispositivos electrónicos sean prestados usando el sistema de préstamos existente
3. WHEN un dispositivo es prestado, THE Electronics Management System SHALL actualizar su estado a "prestado" automáticamente
4. WHEN un dispositivo es devuelto, THE Electronics Management System SHALL actualizar su estado a "disponible" automáticamente
5. THE Electronics Management System SHALL mantener sincronizada la información entre el módulo de electrónicos y el sistema de préstamos

### Requirement 8

**User Story:** Como administrador, quiero poder categorizar los dispositivos electrónicos por tipo, para organizar mejor el inventario tecnológico.

#### Acceptance Criteria

1. THE Electronics Management System SHALL soportar las siguientes categorías: Laptops, Tablets, Smartphones, Periféricos, Digitales y Otros
2. WHEN el administrador crea un dispositivo, THE Electronics Management System SHALL requerir la selección de una categoría
3. THE Electronics Management System SHALL permitir filtrar dispositivos por categoría
4. WHEN se muestra la lista de dispositivos, THE Electronics Management System SHALL indicar visualmente la categoría de cada dispositivo
5. THE Electronics Management System SHALL permitir cambiar la categoría de un dispositivo existente

### Requirement 9

**User Story:** Como administrador, quiero que el sistema valide la información ingresada para dispositivos electrónicos, para mantener la integridad de los datos del inventario.

#### Acceptance Criteria

1. WHEN el administrador ingresa información de un dispositivo, THE Electronics Management System SHALL validar que el nombre no esté vacío
2. THE Electronics Management System SHALL validar que el código QR sea único en el sistema
3. WHEN se ingresan especificaciones numéricas, THE Electronics Management System SHALL validar que sean valores positivos
4. THE Electronics Management System SHALL validar que las fechas ingresadas sean válidas y coherentes
5. WHEN la validación falla, THE Electronics Management System SHALL mostrar mensajes de error específicos para cada campo

### Requirement 10

**User Story:** Como administrador, quiero poder acceder a la gestión de electrónicos desde el panel de administración principal, para tener fácil acceso a esta funcionalidad.

#### Acceptance Criteria

1. WHEN el administrador accede al panel de administración, THE Electronics Management System SHALL mostrar una opción de navegación para "Electrónicos"
2. THE Electronics Management System SHALL mostrar un contador de dispositivos electrónicos en el dashboard principal
3. WHEN el administrador hace clic en la opción de electrónicos, THE Electronics Management System SHALL navegar a la página de gestión de electrónicos
4. THE Electronics Management System SHALL mantener consistencia visual con el resto del panel de administración
5. THE Electronics Management System SHALL ser accesible solo para usuarios con rol de administrador
