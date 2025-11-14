# Dashboard + Scanner Unification - Design Document

## Overview

Este diseño unifica las páginas Dashboard y Scanner en una sola vista principal que sirve como hub central de la aplicación. El usuario tendrá acceso a todas las acciones principales desde un solo lugar, eliminando la confusión y redundancia de tener dos páginas separadas.

## Architecture

### High-Level Structure

```
Unified Dashboard Page
├── DashboardHeader
│   ├── Saludo personalizado: "Hello, Felix_Rosario!"
│   ├── Notificaciones (con badge)
│   └── Configuración/Settings
│
├── QuickActionsGrid (6 cards en grid 2x3)
│   ├── Scan to Loan (destacado en rojo)
│   ├── Scan to Return
│   ├── Request Supplies
│   ├── My Loans
│   ├── Return Consumables (con borde destacado)
│   └── Devolver Herramientas
│
├── ActiveLoansSection
│   ├── Lista de préstamos activos
│   ├── Empty state si no hay préstamos
│   └── Información de estado por préstamo
│
└── BottomNav (sin tab Scanner)
    ├── Dashboard (activo)
    ├── My Loans
    ├── Consumables
    └── Admin (si aplica)
```

## Components

### 1. UnifiedDashboard (Principal)

**Ubicación:** `src/app/dashboard/page.tsx`

**Responsabilidades:**

- Renderizar el header personalizado
- Mostrar las 6 action cards en grid
- Mostrar la sección de Active Loans
- Manejar navegación a diferentes páginas
- Integrar funcionalidad de escáner QR

**State:**

```typescript
interface UnifiedDashboardState {
  isScanning: boolean;
  scanMode: "loan" | "return" | null;
  loans: Loan[];
  isLoadingLoans: boolean;
}
```

### 2. ActionCard (Reutilizable)

**Ubicación:** `src/components/dashboard/ActionCard.tsx` (ya existe, reutilizar)

**Props:**

```typescript
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: "red" | "blue" | "green" | "gray";
  highlighted?: boolean; // Para Return Consumables
  onClick: () => void;
}
```

**Variantes:**

1. **Scan to Loan** - Rojo, icono QR scanner
2. **Scan to Return** - Blanco, icono check/return
3. **Request Supplies** - Blanco, icono caja
4. **My Loans** - Blanco, icono lista
5. **Return Consumables** - Verde con borde, icono reciclaje
6. **Devolver Herramientas** - Blanco, icono edificio

### 3. QRScannerModal (Nuevo)

**Ubicación:** `src/components/scanner/QRScannerModal.tsx`

**Responsabilidades:**

- Mostrar escáner QR en modal
- Manejar escaneo de códigos
- Integrar con bag/bulto existente
- Cerrar modal al completar

**Props:**

```typescript
interface QRScannerModalProps {
  isOpen: boolean;
  mode: "loan" | "return";
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}
```

## Data Flow

### Scan to Loan Flow

```
Usuario click "Scan to Loan"
    ↓
Abre QRScannerModal (mode: 'loan')
    ↓
Usuario escanea QR
    ↓
Valida código
    ↓
Busca herramienta en API
    ↓
Agrega a bag/bulto
    ↓
Usuario puede seguir escaneando o confirmar
    ↓
Confirma préstamo
    ↓
Crea préstamos en API
    ↓
Redirige a My Loans
```

### Scan to Return Flow

```
Usuario click "Scan to Return"
    ↓
Abre QRScannerModal (mode: 'return')
    ↓
Usuario escanea QR
    ↓
Valida código
    ↓
Busca préstamo activo
    ↓
Confirma devolución
    ↓
Actualiza préstamo en API
    ↓
Muestra confirmación
```

## Layout

### Mobile (< 768px)

```
┌─────────────────────────────┐
│ Hello, Felix! 🔔 ⚙️         │
├─────────────────────────────┤
│                             │
│ ┌───────────┐ ┌───────────┐│
│ │ Scan to   │ │ Scan to   ││
│ │ Loan      │ │ Return    ││
│ │  (RED)    │ │           ││
│ └───────────┘ └───────────┘│
│                             │
│ ┌───────────┐ ┌───────────┐│
│ │ Request   │ │ My        ││
│ │ Supplies  │ │ Loans     ││
│ └───────────┘ └───────────┘│
│                             │
│ ┌───────────┐ ┌───────────┐│
│ │ Return    │ │ Devolver  ││
│ │Consumables│ │Herramientas│
│ │ (BORDER)  │ │           ││
│ └───────────┘ └───────────┘│
│                             │
├─────────────────────────────┤
│ Active Loans                │
│ ┌─────────────────────────┐ │
│ │ Hammer #123             │ │
│ │ 2 days left             │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🏠 My Loans 📦 Consumables  │
└─────────────────────────────┘
```

### Tablet/Desktop (> 768px)

```
┌─────────────────────────────────────┐
│ Hello, Felix_Rosario! 🔔 ⚙️         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Scan to │ │ Scan to │ │ Request ││
│ │ Loan    │ │ Return  │ │Supplies ││
│ │ (RED)   │ │         │ │         ││
│ └─────────┘ └─────────┘ └─────────┘│
│                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ My      │ │ Return  │ │Devolver ││
│ │ Loans   │ │Consumab.│ │Herramie.││
│ │         │ │(BORDER) │ │         ││
│ └─────────┘ └─────────┘ └─────────┘│
│                                     │
├─────────────────────────────────────┤
│ Active Loans                        │
│ ┌───────────────────────────────┐   │
│ │ Hammer #123 - 2 days left     │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Styling

### Color Scheme

```css
/* Action Cards */
--scan-loan-red: #EF4444
--scan-loan-red-hover: #DC2626
--card-white: #FFFFFF
--card-border: #E5E7EB
--return-consumables-border: #EF4444
--return-consumables-bg: #FEF2F2

/* Dark Mode */
--card-dark: #1F2937
--card-border-dark: #374151
```

### Card Styles

**Scan to Loan (Destacado):**

```css
.scan-to-loan-card {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```

**Return Consumables (Con borde):**

```css
.return-consumables-card {
  border: 2px solid #ef4444;
  background: #fef2f2;
}
```

**Cards Normales:**

```css
.action-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

## Navigation Changes

### Bottom Navigation Update

**Antes:**

```
[Dashboard] [Scanner] [My Loans] [Consumables] [Admin]
```

**Después:**

```
[Dashboard] [My Loans] [Consumables] [Admin]
```

### Route Redirects

```typescript
// src/app/tools/scan/page.tsx
export default function ScannerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, []);

  return null;
}
```

## Scanner Integration

### QR Scanner Modal

El escáner QR se abrirá en un modal overlay en lugar de una página separada:

```typescript
<QRScannerModal
  isOpen={isScanning}
  mode={scanMode}
  onClose={() => setIsScanning(false)}
  onScanSuccess={handleScanSuccess}
/>
```

### Bag/Bulto Integration

Mantener la funcionalidad existente del bag:

- Usuario escanea múltiples herramientas
- Se agregan al bag
- Confirma todo junto
- Crea préstamos en batch

## API Integration

### Existing Endpoints (Reutilizar)

1. **GET /api/tools/qr/:uuid** - Buscar herramienta por QR
2. **POST /api/loans** - Crear préstamo
3. **GET /api/loans/my** - Obtener préstamos del usuario
4. **PUT /api/loans/:id/return** - Devolver herramienta

No se requieren nuevos endpoints.

## Performance Considerations

### Code Splitting

```typescript
// Lazy load scanner modal
const QRScannerModal = lazy(
  () => import("@/components/scanner/QRScannerModal")
);

// Lazy load bag components
const BagModal = lazy(() => import("@/components/bag/BagModal"));
```

### Optimizations

1. **Memoization:** Memoizar cálculos de préstamos activos
2. **Debouncing:** Debounce en búsquedas
3. **Image Optimization:** Optimizar iconos SVG
4. **Bundle Size:** Reducir al eliminar página Scanner duplicada

## Accessibility

### Keyboard Navigation

```
Tab Order:
1. Notificaciones
2. Settings
3. Scan to Loan
4. Scan to Return
5. Request Supplies
6. My Loans
7. Return Consumables
8. Devolver Herramientas
9. Active Loans (si hay)
10. Bottom Nav
```

### ARIA Labels

```tsx
<button
  aria-label="Scan QR code to create a loan"
  aria-describedby="scan-loan-description"
>
  Scan to Loan
</button>
```

### Screen Reader Support

- Anunciar cuando se abre el escáner
- Anunciar cuando se escanea exitosamente
- Anunciar errores claramente

## Error Handling

### Scenarios

1. **QR inválido:** Mostrar toast de error
2. **Herramienta no disponible:** Mostrar mensaje específico
3. **Error de red:** Mostrar retry button
4. **Cámara no disponible:** Mostrar mensaje de permisos

## Testing Strategy

### Unit Tests

```typescript
describe("UnifiedDashboard", () => {
  it("renders all 6 action cards");
  it("opens scanner modal on Scan to Loan click");
  it("opens scanner modal on Scan to Return click");
  it("navigates to correct pages");
  it("displays active loans");
});
```

### Integration Tests

```typescript
describe("Scanner Integration", () => {
  it("scans QR and adds to bag");
  it("creates loan from bag");
  it("handles scan errors");
});
```

### E2E Tests

```typescript
describe("Dashboard E2E", () => {
  it("user can scan and create loan");
  it("user can scan and return tool");
  it("user can navigate to all pages");
});
```

## Migration Plan

### Phase 1: Create Unified Dashboard

1. Create new dashboard with 6 action cards
2. Integrate QR scanner modal
3. Test thoroughly

### Phase 2: Redirect Scanner

1. Update /tools/scan to redirect to /dashboard
2. Update bottom navigation
3. Remove Scanner tab

### Phase 3: Cleanup

1. Archive old Scanner page (don't delete yet)
2. Update documentation
3. Monitor for issues

### Phase 4: Final Cleanup

1. Delete old Scanner page after 2 weeks
2. Remove unused code
3. Update tests

## Rollback Plan

Si algo sale mal:

```bash
# Revertir cambios
git revert <commit-hash>

# O restaurar Scanner page
mv src/app/tools/scan/page-backup.tsx src/app/tools/scan/page.tsx
```

## Success Metrics

- ✅ Una sola página en lugar de dos
- ✅ Todas las funciones accesibles desde Dashboard
- ✅ No hay tab Scanner en bottom nav
- ✅ /tools/scan redirige a /dashboard
- ✅ Funcionalidad del escáner QR intacta
- ✅ Active Loans visible
- ✅ Performance igual o mejor
- ✅ Sin errores de TypeScript
- ✅ Tests pasando

## Future Enhancements

### Phase 2

- Agregar quick stats (total loans, due soon, overdue)
- Personalización de orden de cards
- Shortcuts de teclado

### Phase 3

- Widgets arrastrables
- Temas personalizados
- Notificaciones push

## Conclusion

Este diseño unifica Dashboard y Scanner en una experiencia cohesiva que:

- ✅ Elimina redundancia
- ✅ Simplifica navegación
- ✅ Mejora UX
- ✅ Reduce código duplicado
- ✅ Mantiene toda la funcionalidad
