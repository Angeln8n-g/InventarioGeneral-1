# Plan de Optimización de Caché y Actualización de Datos

## 🎯 Objetivo

Eliminar la necesidad de recargar la app manualmente después de acciones, implementando invalidación automática de caché.

## 📊 Estado Actual

### ✅ Lo que ya funciona bien:

- RTK Query configurado con tags: `['Tool', 'Loan', 'Consumable', 'Notification', 'User', 'NotificationPreferences']`
- Algunos endpoints ya tienen `invalidatesTags` configurados
- Polling configurado para notificaciones (30s)

### ❌ Problemas identificados:

1. **Uso de `fetch` directo** en lugar de RTK Query mutations en:

   - `/tools/scan/page.tsx` - Creación de préstamos
   - `/tools/return/page.tsx` - Devolución de herramientas
   - `/consumables/scan/page.tsx` - Consumo de suministros
   - `/my-loans/page.tsx` - Fetch de consumos

2. **Falta de invalidación** después de acciones críticas
3. **Navegación sin refetch** - Usar `router.push()` sin invalidar caché

## 🔧 Plan de Implementación

### Fase 1: Agregar Mutations Faltantes a API (PRIORIDAD ALTA)

```typescript
// En src/services/api.ts, agregar:

// Batch loan creation
createBatchLoans: builder.mutation<
  { data: Loan[]; message: string },
  Array<{ tool_instance_id: number; due_date: string; notes?: string }>
>({
  query: (loans) => ({
    url: '/loans/batch',
    method: 'POST',
    body: { loans },
  }),
  invalidatesTags: ['Loan', 'Tool', 'Notification'],
}),

// Consume consumable
consumeConsumable: builder.mutation<
  { data: any; message: string },
  { consumable_stock_id: number; quantity: number; notes?: string }
>({
  query: (data) => ({
    url: '/consumables/consume',
    method: 'POST',
    body: data,
  }),
  invalidatesTags: ['Consumable', 'Notification'],
}),

// Return consumable
returnConsumable: builder.mutation<
  { data: any; message: string },
  { consumable_stock_id: number; quantity: number; notes?: string }
>({
  query: (data) => ({
    url: '/consumables/return',
    method: 'POST',
    body: data,
  }),
  invalidatesTags: ['Consumable'],
}),

// Get my consumptions
getMyConsumptions: builder.query<
  { data: any[] },
  void
>({
  query: () => '/consumables/my-consumption',
  providesTags: ['Consumable'],
}),
```

### Fase 2: Migrar Componentes a usar Mutations (PRIORIDAD ALTA)

#### Ejemplo: `/tools/scan/page.tsx`

**Antes (usando fetch directo):**

```typescript
const handleConfirmBag = async (dueDate: string, notes?: string) => {
  const promises = bagItems.map(item =>
    fetch('/api/loans', {
      method: 'POST',
      headers: { ... },
      body: JSON.stringify({ ... }),
    })
  )
  await Promise.all(promises)
  router.push('/my-loans')
}
```

**Después (usando RTK Query):**

```typescript
import { useCreateBatchLoansMutation } from "@/services/api";

const [createBatchLoans, { isLoading }] = useCreateBatchLoansMutation();

const handleConfirmBag = async (dueDate: string, notes?: string) => {
  try {
    const loans = bagItems.map((item) => ({
      tool_instance_id: item.tool_id,
      due_date: dueDate,
      notes: notes || "Préstamo vía escáner QR",
    }));

    await createBatchLoans(loans).unwrap();
    // ✅ Caché se invalida automáticamente
    // ✅ Dashboard y My Loans se actualizan solos

    clearBag();
    router.push("/my-loans?success=loan_created");
  } catch (error) {
    setError(error.message);
  }
};
```

### Fase 3: Optimizar Navegación (PRIORIDAD MEDIA)

Agregar refetch en navegación crítica:

```typescript
// En componentes que navegan después de acciones
const { refetch: refetchLoans } = useGetMyLoansQuery();

const handleAction = async () => {
  await someAction();
  await refetchLoans(); // Forzar refetch antes de navegar
  router.push("/my-loans");
};
```

### Fase 4: Implementar Optimistic Updates (PRIORIDAD BAJA)

Para mejor UX, actualizar UI antes de que el servidor responda:

```typescript
returnTool: builder.mutation({
  query: (loanId) => ({ ... }),
  invalidatesTags: ['Loan', 'Tool'],
  // Optimistic update
  async onQueryStarted(loanId, { dispatch, queryFulfilled }) {
    // Actualizar caché inmediatamente
    const patchResult = dispatch(
      api.util.updateQueryData('getMyLoans', undefined, (draft) => {
        const loan = draft.data.find(l => l.id === loanId)
        if (loan) loan.status = 'returned'
      })
    )

    try {
      await queryFulfilled
    } catch {
      // Revertir si falla
      patchResult.undo()
    }
  },
}),
```

## 📋 Checklist de Implementación

### Inmediato (Esta Semana):

- [ ] Agregar mutations faltantes a `src/services/api.ts`
- [ ] Migrar `/tools/scan/page.tsx` a usar mutations
- [ ] Migrar `/tools/return/page.tsx` a usar mutations
- [ ] Migrar `/consumables/scan/page.tsx` a usar mutations
- [ ] Migrar `/my-loans/page.tsx` a usar query para consumptions

### Corto Plazo (Próximas 2 Semanas):

- [ ] Auditar todos los `fetch` directos en el proyecto
- [ ] Reemplazar con RTK Query mutations
- [ ] Agregar loading states consistentes
- [ ] Implementar error handling unificado

### Mediano Plazo (Próximo Mes):

- [ ] Implementar optimistic updates en acciones críticas
- [ ] Agregar retry logic donde sea necesario
- [ ] Configurar cache timing apropiado por endpoint
- [ ] Implementar prefetching para navegación anticipada

## 🎯 Beneficios Esperados

1. **Sin recargas manuales** - Todo se actualiza automáticamente
2. **Mejor UX** - Updates instantáneos con optimistic updates
3. **Menos bugs** - Estado sincronizado automáticamente
4. **Código más limpio** - Menos lógica de fetch manual
5. **Mejor performance** - Caché inteligente, menos requests

## 📚 Recursos

- [RTK Query - Automated Re-fetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching)
- [RTK Query - Optimistic Updates](https://redux-toolkit.js.org/rtk-query/usage/optimistic-updates)
- [RTK Query - Cache Behavior](https://redux-toolkit.js.org/rtk-query/usage/cache-behavior)

## 🚀 Próximos Pasos

1. Revisar este documento con el equipo
2. Priorizar las migraciones más críticas
3. Crear branches para cada fase
4. Implementar y testear incrementalmente
5. Documentar patrones para futuros endpoints
