# Guía: Refrescar Datos al Cerrar Modales

## 📋 Resumen

Esta guía explica cómo refrescar automáticamente los datos cuando se cierra un modal, para que los cambios se vean inmediatamente sin recargar la página completa.

---

## ✅ Implementación Actual

### En `src/app/admin/consumables/page.tsx`

Ya está implementado correctamente:

```typescript
// 1. Función para cerrar el modal de detalles
const handleCloseModal = () => {
  setIsModalOpen(false)
  setSelectedConsumableId(null)
  // Remove query parameter from URL
  const url = new URL(window.location.href)
  url.searchParams.delete('view')
  window.history.pushState({}, '', url.toString())
  // ✅ Refresh data to show any changes made in the modal
  fetchData()
}

// 2. Después de editar exitosamente
if (response.ok) {
  toastSuccess('Consumable updated successfully!')
  setShowEditModal(false)
  fetchData() // ✅ Refresca los datos
}

// 3. Después de subir imagen exitosamente
if (response.ok) {
  toastSuccess('Image uploaded successfully!')
  setShowUploadModal(false)
  fetchData() // ✅ Refresca los datos
}

// 4. El modal de detalles también tiene un callback
<ConsumableDetailsModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  consumableId={selectedConsumableId}
  allConsumableIds={filteredItems.map(item => item.id)}
  onNavigate={handleNavigateConsumable}
  onStockUpdated={fetchData} // ✅ Callback para refrescar
/>
```

---

## 🎯 Patrones de Implementación

### Patrón 1: Refetch al Cerrar Modal

**Cuándo usar**: Cuando quieres refrescar siempre que se cierre el modal, independientemente de si hubo cambios.

```typescript
const handleCloseModal = () => {
  setIsModalOpen(false)
  // Limpiar estado
  setSelectedItem(null)
  // Refrescar datos
  fetchData()
}
```

**Ventajas:**
- ✅ Simple y directo
- ✅ Garantiza que los datos estén actualizados
- ✅ No necesitas rastrear si hubo cambios

**Desventajas:**
- ⚠️ Hace una petición extra incluso si no hubo cambios

---

### Patrón 2: Refetch Solo Después de Cambios

**Cuándo usar**: Cuando quieres optimizar y solo refrescar si realmente hubo cambios.

```typescript
const handleSaveChanges = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (response.ok) {
      toastSuccess('Cambios guardados!')
      setShowModal(false)
      fetchData() // ✅ Solo refresca si fue exitoso
    }
  } catch (error) {
    toastError('Error al guardar')
  }
}
```

**Ventajas:**
- ✅ Más eficiente (menos peticiones)
- ✅ Solo refresca cuando es necesario

**Desventajas:**
- ⚠️ Requiere más lógica para rastrear cambios

---

### Patrón 3: Callback Prop

**Cuándo usar**: Cuando el modal es un componente reutilizable.

```typescript
// Componente padre
<MyModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={fetchData} // ✅ Callback para refrescar
/>

// Componente modal
interface MyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void // Callback opcional
}

const MyModal: React.FC<MyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const handleSave = async () => {
    // ... guardar cambios
    if (response.ok) {
      onSuccess?.() // ✅ Llama al callback si existe
      onClose()
    }
  }
}
```

**Ventajas:**
- ✅ Componente reutilizable
- ✅ Flexible (el padre decide qué hacer)
- ✅ Separación de responsabilidades

---

### Patrón 4: React Query / SWR (Recomendado para proyectos grandes)

**Cuándo usar**: Cuando usas librerías de gestión de estado del servidor.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()
  
  // Query para obtener datos
  const { data } = useQuery({
    queryKey: ['consumables'],
    queryFn: fetchConsumables
  })
  
  // Mutation para actualizar
  const mutation = useMutation({
    mutationFn: updateConsumable,
    onSuccess: () => {
      // ✅ Invalida y refresca automáticamente
      queryClient.invalidateQueries({ queryKey: ['consumables'] })
      toastSuccess('Actualizado!')
      setShowModal(false)
    }
  })
}
```

**Ventajas:**
- ✅ Caché automático
- ✅ Revalidación inteligente
- ✅ Menos código boilerplate
- ✅ Optimistic updates

---

## 🔧 Cómo Aplicarlo en Otros Lugares

### Ejemplo 1: Modal de Herramientas

```typescript
// En src/app/admin/tools/page.tsx

const handleCloseModal = () => {
  setIsModalOpen(false)
  setSelectedToolId(null)
  fetchTools() // ✅ Refresca la lista de herramientas
}

<ToolDetailsModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  toolId={selectedToolId}
  onToolUpdated={fetchTools} // ✅ Callback para cambios
/>
```

### Ejemplo 2: Modal de Usuarios

```typescript
// En src/app/admin/users/page.tsx

const handleUserUpdated = () => {
  fetchUsers() // ✅ Refresca la lista de usuarios
  toastSuccess('Usuario actualizado')
}

<UserEditModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  onSuccess={handleUserUpdated} // ✅ Callback
/>
```

### Ejemplo 3: Modal de Reservas

```typescript
// En src/app/consumables/page.tsx

const handleReservationCreated = () => {
  refetch() // ✅ Si usas React Query
  // O fetchData() si usas fetch manual
  toastSuccess('Reserva creada')
}

<ReservationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={handleReservationCreated}
/>
```

---

## 🎨 Mejores Prácticas

### 1. **Usa Loading States**

```typescript
const [isRefreshing, setIsRefreshing] = useState(false)

const handleCloseModal = async () => {
  setIsModalOpen(false)
  setIsRefreshing(true)
  await fetchData()
  setIsRefreshing(false)
}

// En el UI
{isRefreshing && <LoadingSpinner />}
```

### 2. **Maneja Errores de Refetch**

```typescript
const handleCloseModal = async () => {
  setIsModalOpen(false)
  try {
    await fetchData()
  } catch (error) {
    console.error('Error refreshing data:', error)
    // No mostrar error al usuario, es solo un refresh
  }
}
```

### 3. **Debounce para Múltiples Cambios**

```typescript
import { debounce } from 'lodash'

const debouncedFetch = debounce(fetchData, 500)

const handleChange = () => {
  // Hacer cambio
  debouncedFetch() // ✅ Solo refresca después de 500ms sin cambios
}
```

### 4. **Optimistic Updates**

```typescript
const handleDelete = async (id: number) => {
  // ✅ Actualiza UI inmediatamente
  setItems(items.filter(item => item.id !== id))
  
  try {
    await deleteItem(id)
    toastSuccess('Eliminado')
  } catch (error) {
    // ❌ Revierte si falla
    fetchData()
    toastError('Error al eliminar')
  }
}
```

---

## 📊 Comparación de Enfoques

| Enfoque | Simplicidad | Eficiencia | Escalabilidad | Recomendado Para |
|---------|-------------|------------|---------------|------------------|
| Refetch al cerrar | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Proyectos pequeños |
| Refetch condicional | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Proyectos medianos |
| Callback props | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Componentes reutilizables |
| React Query/SWR | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Proyectos grandes |

---

## 🚀 Implementación Rápida

### Checklist para Agregar Refetch a un Modal

- [ ] Identificar la función que obtiene los datos (ej: `fetchData()`)
- [ ] Agregar llamada a `fetchData()` en el handler de cierre del modal
- [ ] Si el modal hace cambios, llamar a `fetchData()` después del éxito
- [ ] Agregar prop `onSuccess` o similar para callbacks
- [ ] Probar que los cambios se ven inmediatamente
- [ ] Verificar que no hay múltiples peticiones innecesarias

---

## 🐛 Troubleshooting

### Problema: Los datos no se actualizan

**Solución:**
```typescript
// Asegúrate de que fetchData() realmente se está llamando
const handleCloseModal = () => {
  console.log('Closing modal, refreshing data...') // Debug
  setIsModalOpen(false)
  fetchData()
}
```

### Problema: Múltiples peticiones

**Solución:**
```typescript
// Usa un flag para evitar múltiples llamadas
const [isFetching, setIsFetching] = useState(false)

const fetchData = async () => {
  if (isFetching) return // ✅ Evita llamadas duplicadas
  setIsFetching(true)
  try {
    // ... fetch data
  } finally {
    setIsFetching(false)
  }
}
```

### Problema: El modal se cierra antes de que termine la petición

**Solución:**
```typescript
const handleSave = async () => {
  setIsLoading(true)
  try {
    await saveChanges()
    await fetchData() // ✅ Espera a que termine
    setShowModal(false) // ✅ Cierra después
  } finally {
    setIsLoading(false)
  }
}
```

---

## 📝 Resumen

Tu aplicación ya tiene implementado correctamente el refetch de datos al cerrar modales en:

✅ **Modal de detalles de consumibles** - Refresca al cerrar
✅ **Modal de edición** - Refresca después de guardar
✅ **Modal de carga de imagen** - Refresca después de subir

Este patrón asegura que los usuarios vean los cambios inmediatamente sin necesidad de recargar la página completa, mejorando significativamente la experiencia de usuario.

---

**Fecha**: Octubre 2025  
**Estado**: ✅ Implementado y Documentado
