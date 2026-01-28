# Documento de Requisitos

## Introducción

Este documento define los requisitos para el Sistema de Gestión de Permisos Dinámico del Sistema de Inventario CCC. El sistema actual tiene permisos hardcodeados con dos roles fijos (user/admin). La nueva funcionalidad permitirá crear roles personalizados, asignar permisos granulares a roles y usuarios, y gestionar el acceso a secciones y funcionalidades del sistema desde una interfaz administrativa.

## Glosario

- **Sistema_Permisos**: El módulo de gestión de permisos dinámico que reemplaza el sistema hardcodeado actual
- **Rol**: Conjunto nombrado de permisos que puede asignarse a usuarios
- **Permiso**: Capacidad específica para realizar una acción en el sistema (ej: tools:view, loans:create)
- **Permiso_Usuario**: Permiso asignado directamente a un usuario, que sobrescribe los permisos del rol
- **Sección**: Área funcional del sistema accesible por URL (ej: /admin/tools, /dashboard)
- **Matriz_Permisos**: Interfaz visual que muestra permisos como checkboxes organizados por categoría
- **Permiso_Heredado**: Permiso que un usuario obtiene a través de su rol asignado
- **Permiso_Override**: Permiso específico de usuario que anula el permiso heredado del rol
- **Rol_Protegido**: Rol del sistema que no puede ser eliminado ni modificado en permisos críticos (admin)
- **Auditoría_Permisos**: Registro de todos los cambios realizados en roles y permisos

## Requisitos

### Requisito 1: Gestión de Roles Personalizados

**User Story:** Como administrador, quiero crear y gestionar roles personalizados, para poder definir conjuntos de permisos reutilizables que se adapten a las necesidades de mi organización.

#### Criterios de Aceptación

1. WHEN un administrador accede a la página de gestión de permisos THEN el Sistema_Permisos SHALL mostrar una lista de todos los roles existentes con su nombre, descripción y cantidad de usuarios asignados
2. WHEN un administrador crea un nuevo rol con nombre y descripción válidos THEN el Sistema_Permisos SHALL crear el rol en la base de datos y mostrarlo en la lista de roles
3. WHEN un administrador intenta crear un rol con un nombre que ya existe THEN el Sistema_Permisos SHALL rechazar la operación y mostrar un mensaje de error descriptivo
4. WHEN un administrador edita el nombre o descripción de un rol existente THEN el Sistema_Permisos SHALL actualizar el rol y mantener los permisos y usuarios asociados
5. WHEN un administrador elimina un rol que tiene usuarios asignados THEN el Sistema_Permisos SHALL mostrar una confirmación indicando cuántos usuarios serán afectados
6. WHEN un administrador confirma la eliminación de un rol con usuarios THEN el Sistema_Permisos SHALL reasignar esos usuarios al rol "user" por defecto
7. WHEN un administrador intenta eliminar el rol "admin" THEN el Sistema_Permisos SHALL rechazar la operación y mostrar un mensaje indicando que es un rol protegido
8. WHEN un administrador intenta eliminar el rol "user" THEN el Sistema_Permisos SHALL rechazar la operación y mostrar un mensaje indicando que es un rol protegido

### Requisito 2: Asignación de Permisos a Roles

**User Story:** Como administrador, quiero asignar permisos específicos a cada rol, para poder controlar qué acciones pueden realizar los usuarios con ese rol.

#### Criterios de Aceptación

1. WHEN un administrador selecciona un rol para editar permisos THEN el Sistema_Permisos SHALL mostrar una Matriz_Permisos con todos los permisos disponibles organizados por categoría
2. WHEN un administrador marca o desmarca un permiso en la Matriz_Permisos THEN el Sistema_Permisos SHALL actualizar la asignación de permisos del rol en tiempo real
3. WHEN un administrador guarda los cambios de permisos de un rol THEN el Sistema_Permisos SHALL persistir los cambios y registrar la acción en Auditoría_Permisos
4. WHEN un administrador intenta quitar permisos críticos del rol "admin" (SYSTEM_CONFIGURE, USERS_MANAGE) THEN el Sistema_Permisos SHALL rechazar la operación y mostrar un mensaje de protección
5. WHEN los permisos de un rol son modificados THEN el Sistema_Permisos SHALL aplicar los cambios inmediatamente a todos los usuarios con ese rol
6. THE Sistema_Permisos SHALL organizar los permisos en la Matriz_Permisos por las siguientes categorías: Herramientas, Préstamos, Consumibles, Administración, Usuarios, Notificaciones, Auditoría, Reportes, Sistema

### Requisito 3: Permisos Específicos de Usuario (Override)

**User Story:** Como administrador, quiero asignar permisos específicos a usuarios individuales, para poder otorgar o revocar permisos sin cambiar su rol.

#### Criterios de Aceptación

1. WHEN un administrador selecciona un usuario para gestionar permisos THEN el Sistema_Permisos SHALL mostrar los Permisos_Heredados del rol y los Permisos_Override del usuario claramente diferenciados
2. WHEN un administrador agrega un Permiso_Override a un usuario THEN el Sistema_Permisos SHALL otorgar ese permiso adicional al usuario independientemente de su rol
3. WHEN un administrador revoca un Permiso_Override de un usuario THEN el Sistema_Permisos SHALL quitar ese permiso específico, incluso si el rol lo incluye
4. WHEN un administrador guarda los cambios de permisos de un usuario THEN el Sistema_Permisos SHALL persistir los cambios y registrar la acción en Auditoría_Permisos
5. WHEN se consultan los permisos efectivos de un usuario THEN el Sistema_Permisos SHALL calcular la combinación de Permisos_Heredados y Permisos_Override correctamente
6. THE Sistema_Permisos SHALL mostrar visualmente la diferencia entre permisos heredados (gris), permisos agregados (verde) y permisos revocados (rojo)

### Requisito 4: Control de Acceso a Secciones

**User Story:** Como administrador, quiero controlar qué secciones del sistema puede acceder cada rol, para poder restringir la navegación según las responsabilidades de cada usuario.

#### Criterios de Aceptación

1. THE Sistema_Permisos SHALL definir las siguientes secciones controlables: Dashboard, Herramientas, Consumibles, Mis Préstamos, Mis Espacios, Perfil, Admin Dashboard, Admin Herramientas, Admin Consumibles, Admin Electrónicos, Admin Aulas, Admin Asignaciones, Admin Usuarios, Admin Categorías, Admin Reportes, Admin Auditoría, Admin Permisos
2. WHEN un usuario intenta acceder a una sección sin el permiso correspondiente THEN el Sistema_Permisos SHALL redirigir al usuario a una página de acceso denegado
3. WHEN un usuario navega por el sistema THEN el Sistema_Permisos SHALL ocultar del menú de navegación las secciones a las que no tiene acceso
4. WHEN un administrador asigna acceso a una sección a un rol THEN el Sistema_Permisos SHALL permitir el acceso a todos los usuarios con ese rol
5. WHEN se carga la navegación del sistema THEN el Sistema_Permisos SHALL consultar los permisos del usuario y filtrar las opciones de menú en menos de 100ms

### Requisito 5: Interfaz de Administración de Permisos

**User Story:** Como administrador, quiero una interfaz intuitiva para gestionar permisos, para poder realizar cambios de forma eficiente y sin errores.

#### Criterios de Aceptación

1. WHEN un administrador accede a /admin/permissions THEN el Sistema_Permisos SHALL mostrar pestañas para "Roles", "Usuarios" y "Secciones"
2. WHEN un administrador busca usuarios en la pestaña de usuarios THEN el Sistema_Permisos SHALL filtrar por nombre, email o username en tiempo real
3. WHEN un administrador busca roles THEN el Sistema_Permisos SHALL filtrar por nombre de rol en tiempo real
4. THE Sistema_Permisos SHALL mostrar un indicador de cambios pendientes cuando hay modificaciones sin guardar
5. WHEN un administrador intenta salir de la página con cambios pendientes THEN el Sistema_Permisos SHALL mostrar una confirmación antes de descartar los cambios
6. WHEN un administrador guarda cambios exitosamente THEN el Sistema_Permisos SHALL mostrar una notificación de éxito con los detalles del cambio
7. IF ocurre un error al guardar cambios THEN el Sistema_Permisos SHALL mostrar un mensaje de error descriptivo y mantener los datos del formulario

### Requisito 6: Auditoría de Cambios en Permisos

**User Story:** Como administrador, quiero ver un historial de todos los cambios en permisos, para poder rastrear quién hizo qué cambios y cuándo.

#### Criterios de Aceptación

1. WHEN un administrador modifica permisos de un rol THEN el Sistema_Permisos SHALL registrar en Auditoría_Permisos: usuario que hizo el cambio, rol afectado, permisos agregados, permisos removidos, fecha y hora
2. WHEN un administrador modifica permisos de un usuario THEN el Sistema_Permisos SHALL registrar en Auditoría_Permisos: usuario que hizo el cambio, usuario afectado, permisos agregados, permisos removidos, fecha y hora
3. WHEN un administrador crea o elimina un rol THEN el Sistema_Permisos SHALL registrar la acción en Auditoría_Permisos con todos los detalles relevantes
4. WHEN un administrador consulta el historial de auditoría THEN el Sistema_Permisos SHALL mostrar los registros ordenados por fecha descendente con filtros por tipo de acción, usuario y fecha
5. THE Sistema_Permisos SHALL almacenar los registros de Auditoría_Permisos de forma inmutable, sin permitir modificación ni eliminación

### Requisito 7: Validación y Seguridad

**User Story:** Como administrador del sistema, quiero que el sistema de permisos sea seguro, para evitar accesos no autorizados y cambios maliciosos.

#### Criterios de Aceptación

1. THE Sistema_Permisos SHALL validar permisos tanto en el frontend (UI) como en el backend (API) para cada operación
2. WHEN un usuario no autenticado intenta acceder a la API de permisos THEN el Sistema_Permisos SHALL rechazar la solicitud con código 401
3. WHEN un usuario sin rol de administrador intenta modificar permisos THEN el Sistema_Permisos SHALL rechazar la solicitud con código 403
4. THE Sistema_Permisos SHALL prevenir que un administrador se quite a sí mismo el permiso de gestionar permisos
5. WHEN se realiza una operación de permisos THEN el Sistema_Permisos SHALL validar que el usuario tiene el permiso ADMIN_MANAGE_PERMISSIONS
6. IF un token de sesión expira durante la edición de permisos THEN el Sistema_Permisos SHALL redirigir al login preservando los cambios pendientes en localStorage

### Requisito 8: Migración y Compatibilidad

**User Story:** Como desarrollador, quiero que el nuevo sistema sea compatible con el código existente, para minimizar los cambios necesarios en la aplicación.

#### Criterios de Aceptación

1. THE Sistema_Permisos SHALL mantener compatibilidad con las funciones existentes: hasPermission, hasAnyPermission, hasAllPermissions
2. THE Sistema_Permisos SHALL mantener compatibilidad con los componentes existentes: RoleGuard, PermissionGuard, usePermissions
3. WHEN el sistema inicia por primera vez con la nueva estructura THEN el Sistema_Permisos SHALL migrar los roles y permisos hardcodeados a la base de datos
4. THE Sistema_Permisos SHALL mantener los mismos identificadores de permisos existentes (tools:view, loans:create, etc.)
5. WHEN se consultan permisos THEN el Sistema_Permisos SHALL priorizar la base de datos sobre las constantes hardcodeadas
6. THE Sistema_Permisos SHALL incluir un script de migración que preserve todos los usuarios y sus roles actuales

### Requisito 9: Rendimiento y Caché

**User Story:** Como usuario del sistema, quiero que la verificación de permisos sea rápida, para no experimentar retrasos en la navegación.

#### Criterios de Aceptación

1. WHEN se verifican permisos de un usuario THEN el Sistema_Permisos SHALL completar la verificación en menos de 50ms
2. THE Sistema_Permisos SHALL implementar caché de permisos en el cliente para evitar consultas repetidas a la base de datos
3. WHEN los permisos de un usuario cambian THEN el Sistema_Permisos SHALL invalidar el caché del usuario afectado inmediatamente
4. WHEN un usuario inicia sesión THEN el Sistema_Permisos SHALL cargar todos sus permisos efectivos en una sola consulta
5. THE Sistema_Permisos SHALL utilizar índices de base de datos optimizados para consultas de permisos por usuario y por rol
