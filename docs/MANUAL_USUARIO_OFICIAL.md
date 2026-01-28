# 📘 Manual de Usuario Oficial
## Sistema de Gestión de Inventario CCC (Centro de Competencias Claro)

---

## 📋 Índice

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Dashboard Principal](#3-dashboard-principal)
4. [Módulo de Herramientas](#4-módulo-de-herramientas)
5. [Módulo de Consumibles](#5-módulo-de-consumibles)
6. [Módulo de Dispositivos Electrónicos](#6-módulo-de-dispositivos-electrónicos)
7. [Sistema de Reservas](#7-sistema-de-reservas)
8. [Sistema de Notificaciones](#8-sistema-de-notificaciones)
9. [Gestión de Aulas y Evaluaciones](#9-gestión-de-aulas-y-evaluaciones)
10. [Panel de Administración](#10-panel-de-administración)
11. [Reportes y Estadísticas](#11-reportes-y-estadísticas)
12. [Perfil de Usuario](#12-perfil-de-usuario)

---

## 1. Introducción

### ¿Qué es el Sistema de Inventario CCC?

El Sistema de Gestión de Inventario CCC es una plataforma integral diseñada para administrar eficientemente:

- **Herramientas**: Préstamos, devoluciones y seguimiento de herramientas físicas
- **Consumibles**: Solicitud, reserva y control de stock de materiales consumibles
- **Dispositivos Electrónicos**: Gestión de laptops, tablets y equipos tecnológicos
- **Aulas/Espacios**: Evaluación y gestión de espacios físicos

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| 📱 **Responsive** | Funciona en computadoras, tablets y móviles |
| 📷 **Escaneo QR** | Identificación rápida mediante códigos QR |
| 🔔 **Notificaciones** | Alertas en tiempo real y por Microsoft Teams |
| 📊 **Reportes** | Exportación a PDF, Excel y CSV |
| 🎨 **Tema Claro** | Diseño corporativo personalizado |

### Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Usuario** | Solicitar préstamos, consumibles, hacer reservas |
| **Administrador** | Gestión completa del sistema, reportes, usuarios |
| **Evaluador** | Realizar evaluaciones de aulas |
| **Responsable de Aula** | Gestionar aula asignada, responder evaluaciones |

---

## 2. Acceso al Sistema

### Inicio de Sesión

1. Abra el navegador y acceda a la URL del sistema
2. Ingrese su **correo electrónico** y **contraseña**
3. Haga clic en **"Iniciar Sesión"**

```
┌─────────────────────────────────────┐
│     Sistema de Inventario CCC       │
├─────────────────────────────────────┤
│                                     │
│  Correo: [________________]         │
│                                     │
│  Contraseña: [________________]     │
│                                     │
│  [      Iniciar Sesión      ]       │
│                                     │
└─────────────────────────────────────┘
```

### Recuperación de Contraseña

Si olvidó su contraseña, contacte al administrador del sistema para restablecerla.

---

## 3. Dashboard Principal

Al iniciar sesión, verá el **Dashboard Principal** con:

### Secciones del Dashboard

```
┌─────────────────────────────────────────────────────┐
│  🏠 Dashboard                              🔔 👤    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Préstamos   │  │ Consumibles │  │ Reservas    │ │
│  │ Activos: 3  │  │ Pendientes  │  │ Activas: 2  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  📋 Mis Préstamos Activos                          │
│  ├─ Taladro Bosch (Vence: 15/02/2026)             │
│  ├─ Martillo Stanley (Vence: 18/02/2026)          │
│  └─ Destornillador (Vence: 20/02/2026)            │
│                                                     │
│  ⚡ Acciones Rápidas                               │
│  [Solicitar Herramienta] [Solicitar Consumible]   │
│  [Escanear QR] [Ver Reservas]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Navegación Principal

| Icono | Sección | Descripción |
|-------|---------|-------------|
| 🏠 | Dashboard | Página principal con resumen |
| 🔧 | Herramientas | Gestión de herramientas |
| 📦 | Consumibles | Gestión de materiales |
| 📋 | Mis Préstamos | Historial de préstamos |
| 👤 | Perfil | Configuración personal |

---

## 4. Módulo de Herramientas

### 4.1 Ver Herramientas Disponibles

1. Navegue a **Herramientas** desde el menú
2. Visualice las herramientas en formato **grid** o **lista**
3. Use los **filtros** para buscar por categoría, estado o nombre

```
┌─────────────────────────────────────────────────────┐
│  🔧 Herramientas                    [🔍 Buscar]    │
├─────────────────────────────────────────────────────┤
│  Filtros: [Todas ▼] [Disponibles ▼] [Categoría ▼] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 🔧          │  │ 🔨          │  │ 🪛          │ │
│  │ Taladro     │  │ Martillo    │  │ Destorn.    │ │
│  │ Bosch       │  │ Stanley     │  │ Phillips    │ │
│  │ ✅ Disp.    │  │ ✅ Disp.    │  │ ⚠️ Prestado │ │
│  │ [Ver] [QR]  │  │ [Ver] [QR]  │  │ [Ver] [QR]  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4.2 Solicitar Préstamo de Herramienta

**Método 1: Desde la lista**
1. Encuentre la herramienta deseada
2. Haga clic en **"Solicitar Préstamo"**
3. Seleccione la **fecha de devolución**
4. Agregue **notas** opcionales
5. Confirme el préstamo

**Método 2: Escaneo QR**
1. Vaya a **Herramientas > Escanear QR**
2. Apunte la cámara al código QR de la herramienta
3. Confirme la solicitud

### 4.3 Sistema de Bulto (Préstamos Múltiples)

El **Bulto** permite solicitar varias herramientas en un solo préstamo:

1. Escanee múltiples herramientas con el **modo multi-escaneo**
2. Las herramientas se agregan al **bulto** (icono 🎒)
3. Revise el contenido del bulto
4. Confirme el préstamo consolidado

```
┌─────────────────────────────────────┐
│ 🎒 Mi Bulto                    3 ✕  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Taladro Bosch              [✕] │ │
│ │ #TOOL-001 | Disponible          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Martillo Stanley           [✕] │ │
│ │ #TOOL-002 | Disponible          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Destornillador             [✕] │ │
│ │ #TOOL-003 | Disponible          │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Total: 3 herramientas               │
│ [    Confirmar Préstamo    ]        │
└─────────────────────────────────────┘
```

### 4.4 Devolver Herramientas

**Método 1: Desde Mis Préstamos**
1. Vaya a **Mis Préstamos**
2. Seleccione la herramienta a devolver
3. Haga clic en **"Devolver"**
4. Indique el **estado de la herramienta**
5. Confirme la devolución

**Método 2: Sistema Vault (Devoluciones Múltiples)**
1. Vaya a **Herramientas > Devoluciones**
2. Escanee las herramientas a devolver
3. Se agregan al **Vault** (icono 🔐)
4. Revise y confirme todas las devoluciones

---

## 5. Módulo de Consumibles

### 5.1 Ver Consumibles Disponibles

1. Navegue a **Consumibles** desde el menú
2. Visualice los materiales disponibles
3. Vea el **stock en tiempo real**
4. Use filtros por categoría

```
┌─────────────────────────────────────────────────────┐
│  📦 Consumibles                     [🔍 Buscar]    │
├─────────────────────────────────────────────────────┤
│  Categorías: [Cables] [Tornillos] [Cintas] [Todos] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 🔌          │  │ 🔩          │  │ 📎          │ │
│  │ Cable UTP   │  │ Tornillos   │  │ Cinta       │ │
│  │ Cat 6       │  │ 3/8"        │  │ Aislante    │ │
│  │ Stock: 250m │  │ Stock: 500  │  │ Stock: 45   │ │
│  │ [+ Carrito] │  │ [+ Carrito] │  │ [+ Carrito] │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.2 Sistema de Carrito de Compras

El **Carrito** permite solicitar múltiples consumibles en una sola transacción:

1. Haga clic en **"+ Carrito"** en cada consumible
2. Especifique la **cantidad** deseada
3. El carrito muestra el **badge** con el total de items
4. Haga clic en el **icono del carrito** 🛒 para revisar
5. Confirme la solicitud

```
┌─────────────────────────────────────┐
│ 🛒 Mi Carrito                  3 ✕  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Cable UTP Cat 6                 │ │
│ │ Cantidad: [50] metros      [✕] │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Tornillos 3/8"                  │ │
│ │ Cantidad: [100] unidades   [✕] │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Cinta Aislante                  │ │
│ │ Cantidad: [5] rollos       [✕] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Total: 3 items                      │
│                                     │
│ [Reservar] [Solicitar Ahora]        │
└─────────────────────────────────────┘
```

### 5.3 Escaneo QR de Consumibles

1. Vaya a **Consumibles > Escanear QR**
2. Escanee el código QR del consumible
3. Ingrese la **cantidad** a solicitar
4. Confirme o agregue al carrito

### 5.4 Devolver Consumibles

Para devolver consumibles no utilizados:

1. Vaya a **Consumibles > Devoluciones**
2. Escanee o seleccione los consumibles
3. Indique la **fecha de consumo**
4. Confirme la devolución

---

## 6. Módulo de Dispositivos Electrónicos

### 6.1 Ver Dispositivos

Los dispositivos electrónicos incluyen:
- 💻 Laptops
- 📱 Tablets
- 📲 Smartphones
- 🖥️ Monitores
- ⌨️ Periféricos

```
┌─────────────────────────────────────────────────────┐
│  💻 Dispositivos Electrónicos       [🔍 Buscar]    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ 💻 Laptop Dell Latitude 5520                    ││
│  │ Serial: DELL-2024-001                           ││
│  │ Memoria: 16 GB | Estado: ✅ Disponible          ││
│  │ Ubicación: Almacén Principal                    ││
│  │ [Ver Detalles] [Asignar]                        ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 📱 Tablet Samsung Galaxy Tab S8                 ││
│  │ Serial: SAM-2024-015                            ││
│  │ Memoria: 128 GB | Estado: ⚠️ Asignado           ││
│  │ Ubicación: Aula 101                             ││
│  │ [Ver Detalles]                                  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 6.2 Información de Dispositivos

Cada dispositivo muestra:
- **Nombre y modelo**
- **Número de serie**
- **Capacidad de memoria** (GB/TB)
- **Estado** (Disponible, Asignado, En mantenimiento)
- **Ubicación actual**
- **Historial de asignaciones**

---

## 7. Sistema de Reservas

### 7.1 Crear una Reserva

Las reservas permiten apartar consumibles para recoger después:

1. Agregue items al **carrito**
2. En lugar de "Solicitar Ahora", seleccione **"Reservar"**
3. Elija la **fecha de recogida** (máximo 30 días)
4. Agregue un **propósito** opcional
5. Confirme la reserva

```
┌─────────────────────────────────────┐
│ 📅 Nueva Reserva                    │
├─────────────────────────────────────┤
│                                     │
│ Items a reservar:                   │
│ • Cable UTP (50m)                   │
│ • Tornillos 3/8" (100 unidades)     │
│                                     │
│ Fecha de recogida:                  │
│ [📅 03/02/2026          ]           │
│                                     │
│ Propósito (opcional):               │
│ [Proyecto de cableado Aula 205]     │
│                                     │
│ [Cancelar] [Confirmar Reserva]      │
└─────────────────────────────────────┘
```

### 7.2 Ver Mis Reservas

1. Haga clic en **"Mis Reservas"** desde el dashboard o consumibles
2. Vea todas sus reservas activas
3. Opciones disponibles:
   - **Recoger**: Marcar como recogida
   - **Cancelar**: Cancelar la reserva
   - **Extender**: Solicitar más tiempo

### 7.3 Límites de Reservas

| Límite | Valor |
|--------|-------|
| Máximo reservas activas por usuario | 5 |
| Máximo cantidad por item | 50 unidades |
| Máximo porcentaje del stock | 50% |
| Días mínimos de reserva | 1 día |
| Días máximos de reserva | 30 días |

### 7.4 Expiración Automática

- Las reservas **expiran automáticamente** si no se recogen
- Recibirá **notificaciones** 24 horas antes de la expiración
- Los items vuelven al stock disponible

---

## 8. Sistema de Notificaciones

### 8.1 Ver Notificaciones

Las notificaciones aparecen en el **dropdown** del header:

1. Haga clic en el **icono de campana** 🔔
2. Vea las notificaciones recientes
3. Las **no leídas** tienen un indicador azul
4. Haga clic en una notificación para marcarla como leída

```
┌─────────────────────────────────────┐
│ 🔔 Notificaciones              3    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Préstamo Aprobado            │ │
│ │ Tu préstamo de Taladro Bosch    │ │
│ │ ha sido aprobado.               │ │
│ │ hace 5 minutos                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Reserva por Expirar          │ │
│ │ Tu reserva de Cable UTP expira  │ │
│ │ mañana. Recógela pronto.        │ │
│ │ hace 2 horas                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 Devolución Exitosa           │ │
│ │ Has devuelto correctamente      │ │
│ │ el Martillo Stanley.            │ │
│ │ hace 1 día                      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Marcar todas como leídas]          │
└─────────────────────────────────────┘
```

### 8.2 Tipos de Notificaciones

| Tipo | Color | Ejemplos |
|------|-------|----------|
| **Info** | 🔵 Azul | Actualizaciones, información general |
| **Warning** | 🟡 Amarillo | Préstamos por vencer, reservas expirando |
| **Success** | 🟢 Verde | Préstamos aprobados, devoluciones exitosas |
| **Error** | 🔴 Rojo | Solicitudes rechazadas, errores |

### 8.3 Integración con Microsoft Teams

El sistema envía notificaciones automáticas a Microsoft Teams para:
- Evaluaciones completadas
- Evaluaciones aprobadas/rechazadas
- Préstamos vencidos
- Stock bajo de consumibles

---

## 9. Gestión de Aulas y Evaluaciones

### 9.1 Ver Mis Espacios

Si tiene aulas asignadas como responsable:

1. Vaya a **Mis Espacios** desde el menú
2. Vea las aulas bajo su responsabilidad
3. Revise las evaluaciones pendientes

### 9.2 Evaluaciones de Aulas

Las evaluaciones permiten verificar el estado de las aulas:

**Para Evaluadores:**
1. Vaya a **Mis Espacios > Evaluaciones**
2. Seleccione la evaluación asignada
3. Complete el **cuestionario**
4. Envíe la evaluación

**Para Responsables de Aula:**
1. Reciba notificación de evaluación completada
2. Revise los resultados
3. Proporcione **feedback** si es necesario

```
┌─────────────────────────────────────────────────────┐
│  📋 Evaluación - Aula 101                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Puntuación: 85% 👍                                │
│  Clasificación: Aceptable                          │
│                                                     │
│  Evaluador: Juan Pérez                             │
│  Fecha: 27/01/2026                                 │
│                                                     │
│  Comentarios:                                      │
│  "El aula está en buen estado general.            │
│   Se recomienda revisar el proyector."            │
│                                                     │
│  [Ver Detalles] [Responder Feedback]              │
└─────────────────────────────────────────────────────┘
```

---

## 10. Panel de Administración

> ⚠️ **Nota**: Esta sección es solo para usuarios con rol de **Administrador**

### 10.1 Acceso al Panel Admin

1. Inicie sesión con credenciales de administrador
2. Vaya a **Admin** desde el menú principal

### 10.2 Gestión de Herramientas

**Crear Nueva Herramienta:**
1. Vaya a **Admin > Herramientas**
2. Haga clic en **"Nueva Herramienta"**
3. Complete el formulario:
   - Nombre
   - Categoría
   - Número de serie
   - Descripción
   - Estado inicial
4. Guarde la herramienta

**Importación Masiva:**
1. Prepare un archivo **CSV** con el formato requerido
2. Vaya a **Admin > Herramientas > Importar**
3. Suba el archivo CSV
4. Revise la vista previa
5. Confirme la importación

### 10.3 Gestión de Consumibles

Similar a herramientas, con campos adicionales:
- Stock inicial
- Stock mínimo (para alertas)
- Unidad de medida

### 10.4 Gestión de Usuarios

1. Vaya a **Admin > Usuarios**
2. Opciones disponibles:
   - **Crear usuario**: Nuevo usuario con rol asignado
   - **Editar usuario**: Modificar información o rol
   - **Desactivar usuario**: Bloquear acceso

### 10.5 Gestión de Categorías

Las categorías dinámicas permiten:
- Crear categorías personalizadas
- Definir campos específicos por categoría
- Migrar items entre categorías

---

## 11. Reportes y Estadísticas

### 11.1 Tipos de Reportes

| Reporte | Descripción |
|---------|-------------|
| **Préstamos** | Historial de préstamos por período |
| **Consumibles** | Consumo de materiales |
| **Compras** | Registro de adquisiciones |
| **Reservas** | Estadísticas de reservas |
| **Equipos por Aula** | Inventario por ubicación |

### 11.2 Generar un Reporte

1. Vaya a **Admin > Reportes**
2. Seleccione el **tipo de reporte**
3. Configure los **filtros**:
   - Rango de fechas
   - Categoría
   - Usuario
   - Estado
4. Haga clic en **"Generar"**

### 11.3 Exportar Reportes

Los reportes pueden exportarse en:
- 📄 **PDF**: Para impresión o archivo
- 📊 **Excel**: Para análisis adicional
- 📋 **CSV**: Para importación a otros sistemas

```
┌─────────────────────────────────────────────────────┐
│  📊 Reporte de Préstamos                           │
├─────────────────────────────────────────────────────┤
│  Período: 01/01/2026 - 27/01/2026                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ [Gráfico de préstamos por categoría]        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Resumen:                                          │
│  • Total préstamos: 156                            │
│  • Devoluciones a tiempo: 142 (91%)               │
│  • Devoluciones tardías: 14 (9%)                  │
│  • Categoría más solicitada: Herramientas         │
│                                                     │
│  [📄 PDF] [📊 Excel] [📋 CSV]                      │
└─────────────────────────────────────────────────────┘
```

---

## 12. Perfil de Usuario

### 12.1 Ver Mi Perfil

1. Haga clic en el **icono de usuario** 👤
2. Seleccione **"Mi Perfil"**

### 12.2 Cambiar Contraseña

1. Vaya a **Perfil > Cambiar Contraseña**
2. Ingrese su **contraseña actual**
3. Ingrese la **nueva contraseña** (mínimo 8 caracteres)
4. Confirme la nueva contraseña
5. Guarde los cambios

### 12.3 Preferencias de Notificaciones

Configure qué notificaciones desea recibir:
- ✅ Préstamos aprobados
- ✅ Reservas por expirar
- ✅ Stock bajo (solo admin)
- ✅ Sonidos de notificación

---

## 📞 Soporte

Si tiene problemas o preguntas:

1. **Consulte esta documentación** primero
2. **Contacte al administrador** del sistema
3. **Reporte errores** con capturas de pantalla

---

## 📝 Glosario

| Término | Definición |
|---------|------------|
| **Bulto** | Conjunto de herramientas para préstamo múltiple |
| **Carrito** | Conjunto de consumibles para solicitud múltiple |
| **Vault** | Sistema de devolución múltiple de herramientas |
| **QR Code** | Código de barras 2D para identificación rápida |
| **Stock** | Cantidad disponible de un consumible |
| **Reserva** | Apartado de consumibles para recoger después |

---

*Documento generado: Enero 2026*
*Versión del Sistema: 0.1.0*
*Sistema de Gestión de Inventario CCC*
