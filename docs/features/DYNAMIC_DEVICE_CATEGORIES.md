# Sistema de Categorías Dinámicas para Dispositivos Electrónicos

## Descripción General

El sistema de categorías dinámicas permite a los administradores crear, editar y eliminar categorías de dispositivos electrónicos de forma flexible. Anteriormente, las categorías estaban codificadas en la aplicación (Laptops, Tablets, Smartphones, etc.). Ahora, los administradores pueden:

- Crear nuevas categorías personalizadas
- Configurar campos específicos por categoría
- Asignar iconos a las categorías
- Migrar dispositivos entre categorías

## Acceso al Sistema

### Navegación
1. Inicia sesión como administrador
2. Ve al **Panel de Administración**
3. Haz clic en **Categorías** en el menú lateral

### Permisos Requeridos
- Solo usuarios con rol de **administrador** pueden acceder a la gestión de categorías

---

## Gestión de Categorías

### Ver Lista de Categorías

La página principal muestra todas las categorías existentes con:
- **Nombre** de la categoría
- **Descripción** (opcional)
- **Icono** asignado
- **Cantidad de dispositivos** usando esa categoría
- **Estado** (activa/inactiva)

### Crear Nueva Categoría

1. Haz clic en el botón **"Nueva Categoría"**
2. Completa el formulario:
   - **Nombre** (requerido): Debe ser único (no distingue mayúsculas/minúsculas)
   - **Descripción** (opcional): Texto descriptivo de la categoría
   - **Icono** (opcional): Selecciona un emoji del selector de iconos
   - **Estado activo**: Marca si la categoría está disponible para uso
3. Haz clic en **"Crear"**

### Editar Categoría

1. Haz clic en una categoría de la lista
2. En el modal de detalles, haz clic en **"Editar"**
3. Modifica los campos necesarios
4. Haz clic en **"Actualizar"**

> **Nota**: Al cambiar el nombre de una categoría, todos los dispositivos que la usan se actualizarán automáticamente.

### Eliminar Categoría

1. Haz clic en una categoría de la lista
2. En el modal de detalles, haz clic en **"Eliminar"**
3. Confirma la eliminación

> **Importante**: Solo se pueden eliminar categorías que no tengan dispositivos asignados. Si hay dispositivos usando la categoría, primero debes migrarlos a otra categoría.

---

## Configuración de Campos

Cada categoría puede tener campos personalizados que aparecerán en los formularios de dispositivos.

### Tipos de Campos Soportados

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `text` | Campo de texto libre | Número de serie, Notas |
| `number` | Campo numérico | Capacidad de memoria, Año |
| `select` | Lista desplegable | Unidad de memoria (GB/TB) |
| `boolean` | Casilla de verificación | Tiene garantía, Es nuevo |

### Agregar Campo a una Categoría

1. Abre los detalles de una categoría
2. Ve a la sección **"Campos"**
3. Haz clic en **"Agregar Campo"**
4. Completa el formulario:
   - **Nombre del campo** (requerido)
   - **Tipo de campo** (requerido)
   - **Requerido**: Si el campo es obligatorio
   - **Opciones** (solo para tipo `select`): Lista de opciones separadas por coma
5. Haz clic en **"Guardar"**

### Campos Estándar vs Personalizados

- **Campos estándar**: Vienen predefinidos con la categoría (ej: memoria para Laptops)
- **Campos personalizados**: Creados por el administrador

---

## Iconos de Categoría

### Selector de Iconos

El sistema incluye un selector de iconos con emojis organizados por categorías:
- **Electrónicos**: 💻 🖥️ 📱 📲 ⌨️ 🖱️ 🖨️ 📺 🎧 📷
- **Oficina**: 📁 📋 📝 ✏️ 📎 ✂️ 📏
- **Herramientas**: 🔧 🔨 🪛 ⚙️ 🧰
- **General**: 📦 🏷️ 📊 🗂️

### Iconos por Defecto

Si no se selecciona un icono, el sistema usa iconos predeterminados:
- Laptops: 💻
- Tablets: 📲
- Smartphones: 📱
- Periféricos: ⌨️
- Digitales: 📷
- Otros: 📦

---

## Migración de Dispositivos

La migración permite mover dispositivos de una categoría a otra preservando los datos compatibles.

### Proceso de Migración

1. En la página de categorías, haz clic en **"Migrar Dispositivos"**
2. **Paso 1**: Selecciona la categoría de origen
3. **Paso 2**: Selecciona la categoría de destino
4. **Paso 3**: Revisa el análisis de compatibilidad:
   - ✅ **Campos compatibles** (verde): Se preservarán
   - ❌ **Campos incompatibles** (rojo): Se perderán
   - Número de dispositivos a migrar
5. **Paso 4**: Confirma y ejecuta la migración

### Análisis de Compatibilidad

El sistema analiza automáticamente qué campos son compatibles entre categorías:
- Campos con el mismo nombre y tipo se preservan
- Campos que no existen en la categoría destino se pierden

> **Advertencia**: La migración es irreversible. Los datos de campos incompatibles se perderán permanentemente.

---

## Formularios Dinámicos

### Creación de Dispositivos

Al crear un nuevo dispositivo electrónico:
1. Selecciona la categoría
2. El formulario se adapta automáticamente mostrando:
   - Campos estándar del dispositivo
   - Campos específicos de la categoría seleccionada
3. Los campos requeridos se marcan con asterisco (*)

### Edición de Dispositivos

Al editar un dispositivo:
- Si cambias la categoría, aparece una advertencia sobre posible pérdida de datos
- Los campos compatibles se preservan automáticamente
- Los campos incompatibles se limpian

---

## Visualización de Dispositivos

### Tarjetas de Dispositivos

Las tarjetas de dispositivos muestran:
- Icono de la categoría (grande, en la esquina superior izquierda)
- Nombre del dispositivo
- Categoría con su icono
- Campos personalizados (si existen)

### Modal de Detalles

El modal de detalles muestra:
- Icono de categoría prominente junto al nombre
- Sección de especificaciones con todos los campos
- Campos personalizados en sección separada

---

## API Reference

### Endpoints de Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/categories` | Lista todas las categorías |
| POST | `/api/admin/categories` | Crea nueva categoría |
| GET | `/api/admin/categories/[id]` | Obtiene categoría por ID |
| PUT | `/api/admin/categories/[id]` | Actualiza categoría |
| DELETE | `/api/admin/categories/[id]` | Elimina categoría |

### Endpoints de Campos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/categories/[id]/fields` | Lista campos de categoría |
| POST | `/api/admin/categories/[id]/fields` | Crea nuevo campo |
| PUT | `/api/admin/categories/[id]/fields/[fieldId]` | Actualiza campo |
| DELETE | `/api/admin/categories/[id]/fields/[fieldId]` | Elimina campo |

### Endpoints de Migración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/categories/migrate/analyze` | Analiza compatibilidad |
| POST | `/api/admin/categories/migrate/execute` | Ejecuta migración |

---

## Solución de Problemas

### "No se puede eliminar la categoría"
**Causa**: Hay dispositivos usando esta categoría.
**Solución**: Migra los dispositivos a otra categoría antes de eliminar.

### "El nombre de categoría ya existe"
**Causa**: Ya existe una categoría con ese nombre (la comparación no distingue mayúsculas).
**Solución**: Usa un nombre diferente.

### "Los campos personalizados no aparecen"
**Causa**: Los campos pueden no estar configurados para la categoría.
**Solución**: Ve a la configuración de la categoría y agrega los campos necesarios.

### "Se perdieron datos al cambiar categoría"
**Causa**: Los campos de la categoría anterior no existían en la nueva.
**Solución**: Antes de cambiar categoría, verifica la compatibilidad de campos usando la herramienta de migración.

---

## Mejores Prácticas

1. **Planifica las categorías**: Define las categorías necesarias antes de empezar a agregar dispositivos
2. **Usa nombres descriptivos**: Los nombres de categoría deben ser claros y concisos
3. **Configura campos comunes**: Agrega campos que sean relevantes para todos los dispositivos de esa categoría
4. **Usa iconos distintivos**: Ayuda a identificar rápidamente el tipo de dispositivo
5. **Revisa antes de migrar**: Siempre verifica el análisis de compatibilidad antes de migrar dispositivos
