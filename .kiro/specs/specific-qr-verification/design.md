# Design Document - Verificación de QR Específico

## Overview

Este diseño implementa un sistema de verificación de QR mejorado que requiere que los usuarios escaneen un código QR específico seleccionado aleatoriamente, en lugar de permitir cualquiera de los 5 códigos disponibles. Esto aumenta significativamente la seguridad al garantizar que los usuarios se desplacen físicamente por el almacén.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MyReservationsModal                                    │ │
│  │  - Solicita código QR requerido al backend             │ │
│  │  - Muestra ubicación específica al usuario             │ │
│  │  - Valida código escaneado contra el requerido         │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  QRScanner (modificado)                                 │ │
│  │  - Muestra código requerido prominentemente            │ │
│  │  - Valida en tiempo real                               │ │
│  │  - Feedback visual inmediato                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GET /api/reservations/[id]/required-qr                 │ │
│  │  - Selecciona código QR aleatorio                      │ │
│  │  - Retorna información del código                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /api/reservations/[id]/fulfill                    │ │
│  │  - Valida código escaneado vs requerido               │ │
│  │  - Registra intento (éxito o fallo)                   │ │
│  │  - Confirma reserva si es correcto                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  - consumable_reservations (+ required_qr_code_id)         │
│  - qr_scan_attempts (nueva tabla)                          │
│  - warehouse_qr_codes (existente)                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Nuevo Endpoint: GET /api/reservations/[id]/required-qr

**Propósito:** Seleccionar y retornar un código QR aleatorio que el usuario debe escanear.

**Request:**
```typescript
GET /api/reservations/123/required-qr
Headers: {
  Authorization: Bearer <token>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    required_qr_code_id: 3,
    qr_code: "WH-QR-003-CONSUMABLES",
    location_name: "Zona de Consumibles",
    location_description: "Código QR en el área de materiales consumibles",
    zone: "consumables",
    icon: "📦"
  }
}
```

**Lógica:**
1. Verificar autenticación y permisos
2. Verificar que la reserva existe y está activa
3. Consultar códigos QR activos (`is_active = true`)
4. Seleccionar uno aleatoriamente
5. Retornar información completa del código

### 2. Endpoint Modificado: POST /api/reservations/[id]/fulfill

**Cambios:**
- Ahora requiere `required_qr_code_id` además de `warehouse_qr_code_id`
- Valida que ambos IDs coincidan
- Registra intentos fallidos

**Request:**
```typescript
POST /api/reservations/123/fulfill
Headers: {
  Authorization: Bearer <token>
}
Body: {
  warehouse_qr_code_id: 3,        // Código escaneado
  required_qr_code_id: 3          // Código que se solicitó
}
```

**Response (éxito):**
```typescript
{
  success: true,
  data: {
    reservation: { /* datos de la reserva */ },
    message: "Reserva confirmada exitosamente"
  }
}
```

**Response (código incorrecto):**
```typescript
{
  success: false,
  error: {
    code: "WRONG_QR_CODE",
    message: "Código QR incorrecto",
    details: {
      scanned_location: "Entrada Principal",
      required_location: "Zona de Consumibles",
      required_qr_code: "WH-QR-003-CONSUMABLES"
    }
  }
}
```

### 3. Componente Frontend: MyReservationsModal (modificado)

**Nuevos Estados:**
```typescript
const [requiredQR, setRequiredQR] = useState<RequiredQRInfo | null>(null)
const [isLoadingQR, setIsLoadingQR] = useState(false)
const [qrError, setQrError] = useState<string | null>(null)
```

**Nuevo Flujo:**
```typescript
const handleFulfill = async (id: number) => {
  // 1. Solicitar código QR requerido
  setIsLoadingQR(true)
  const requiredQRData = await fetchRequiredQR(id)
  setRequiredQR(requiredQRData)
  
  // 2. Abrir scanner con información del código requerido
  setReservationToFulfill(id)
  setShowScanner(true)
}

const handleWarehouseScan = async (qrCode: string) => {
  // 1. Validar código QR escaneado
  const validateResponse = await validateQR(qrCode)
  
  // 2. Verificar que coincida con el requerido
  if (validateResponse.data.id !== requiredQR.required_qr_code_id) {
    setQrError({
      type: 'WRONG_QR',
      scanned: validateResponse.data.location_name,
      required: requiredQR.location_name
    })
    return
  }
  
  // 3. Confirmar reserva
  await fulfillReservation(reservationToFulfill, {
    warehouse_qr_code_id: validateResponse.data.id,
    required_qr_code_id: requiredQR.required_qr_code_id
  })
}
```

### 4. Componente Frontend: QRScanner (modificado)

**Nueva Prop:**
```typescript
interface QRScannerProps {
  // ... props existentes
  requiredQR?: {
    location_name: string
    location_description: string
    zone: string
    icon: string
  }
}
```

**Nuevo UI:**
```tsx
{requiredQR && (
  <div className="required-qr-banner">
    <div className="icon">{requiredQR.icon}</div>
    <div className="info">
      <h3>Escanea el código ubicado en:</h3>
      <p className="location">{requiredQR.location_name}</p>
      <p className="description">{requiredQR.location_description}</p>
    </div>
  </div>
)}
```

## Data Models

### 1. Modificación: consumable_reservations

**Nueva columna:**
```sql
ALTER TABLE consumable_reservations 
ADD COLUMN required_qr_code_id INTEGER REFERENCES warehouse_qr_codes(id);
```

**Propósito:** Registrar qué código QR se solicitó al usuario (puede ser diferente del que escaneó si hubo error).

### 2. Nueva Tabla: qr_scan_attempts

**Propósito:** Registrar todos los intentos de escaneo, incluyendo los fallidos.

```sql
CREATE TABLE qr_scan_attempts (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES consumable_reservations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_qr_code_id INTEGER NOT NULL REFERENCES warehouse_qr_codes(id),
  scanned_qr_code_id INTEGER REFERENCES warehouse_qr_codes(id),
  scanned_qr_code_text VARCHAR(255),  -- Para códigos no válidos
  is_successful BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_scan_attempts_reservation ON qr_scan_attempts(reservation_id);
CREATE INDEX idx_qr_scan_attempts_user ON qr_scan_attempts(user_id);
CREATE INDEX idx_qr_scan_attempts_date ON qr_scan_attempts(attempt_date);
CREATE INDEX idx_qr_scan_attempts_success ON qr_scan_attempts(is_successful);
```

### 3. Nueva Vista: qr_scan_statistics

**Propósito:** Facilitar consultas de estadísticas de escaneo.

```sql
CREATE OR REPLACE VIEW qr_scan_statistics AS
SELECT 
  wq.id as qr_code_id,
  wq.qr_code,
  wq.location_name,
  wq.zone,
  COUNT(DISTINCT qsa.reservation_id) as times_required,
  COUNT(CASE WHEN qsa.is_successful THEN 1 END) as successful_scans,
  COUNT(CASE WHEN NOT qsa.is_successful THEN 1 END) as failed_scans,
  ROUND(
    COUNT(CASE WHEN qsa.is_successful THEN 1 END)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as success_rate,
  MAX(qsa.attempt_date) as last_scan_attempt
FROM warehouse_qr_codes wq
LEFT JOIN qr_scan_attempts qsa ON qsa.required_qr_code_id = wq.id
GROUP BY wq.id, wq.qr_code, wq.location_name, wq.zone;
```

## Error Handling

### 1. Código QR Incorrecto

**Escenario:** Usuario escanea un código QR válido del almacén, pero no es el requerido.

**Manejo:**
```typescript
// Frontend
if (scannedQRId !== requiredQRId) {
  showError({
    title: "Código QR Incorrecto",
    message: `Has escaneado el código de "${scannedLocation}". 
              Por favor, escanea el código ubicado en "${requiredLocation}".`,
    type: "warning",
    icon: "⚠️"
  })
  
  // Vibración de error
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }
  
  // Registrar intento fallido
  await logScanAttempt({
    reservation_id,
    required_qr_code_id: requiredQRId,
    scanned_qr_code_id: scannedQRId,
    is_successful: false
  })
}
```

### 2. Código QR No Válido

**Escenario:** Usuario escanea un código QR que no pertenece al almacén.

**Manejo:**
```typescript
// Backend - validate-qr endpoint
if (!warehouseQR) {
  await logScanAttempt({
    reservation_id,
    required_qr_code_id: requiredQRId,
    scanned_qr_code_text: qrCode,
    is_successful: false
  })
  
  return {
    error: "INVALID_QR_CODE",
    message: "Este código QR no pertenece al almacén",
    hint: `Busca el código en: ${requiredLocation}`
  }
}
```

### 3. No Hay Códigos QR Activos

**Escenario:** Todos los códigos QR están desactivados.

**Manejo:**
```typescript
// Backend - required-qr endpoint
const activeQRCodes = await getActiveWarehouseQRCodes()

if (activeQRCodes.length === 0) {
  // Notificar a administradores
  await notifyAdmins({
    type: "CRITICAL",
    message: "No hay códigos QR activos en el almacén",
    action_required: true
  })
  
  return {
    error: "NO_ACTIVE_QR_CODES",
    message: "Sistema temporalmente no disponible. Contacta al administrador.",
    fallback: "Puedes usar entrada manual con cualquier código del almacén"
  }
}
```

### 4. Timeout de Escaneo

**Escenario:** Usuario tarda mucho en escanear (posible abandono).

**Manejo:**
```typescript
// Frontend
const SCAN_TIMEOUT = 5 * 60 * 1000 // 5 minutos

useEffect(() => {
  if (showScanner) {
    const timeout = setTimeout(() => {
      showWarning({
        message: "¿Necesitas ayuda para encontrar el código QR?",
        actions: [
          { label: "Ver ubicación nuevamente", onClick: showQRLocation },
          { label: "Cancelar", onClick: handleCancel }
        ]
      })
    }, SCAN_TIMEOUT)
    
    return () => clearTimeout(timeout)
  }
}, [showScanner])
```

## Testing Strategy

### 1. Unit Tests

**Backend:**
```typescript
describe('Required QR Selection', () => {
  test('should select random QR code from active codes', async () => {
    const qrCode = await selectRequiredQRCode()
    expect(qrCode).toBeDefined()
    expect(qrCode.is_active).toBe(true)
  })
  
  test('should not select same QR code twice in a row', async () => {
    const qr1 = await selectRequiredQRCode()
    const qr2 = await selectRequiredQRCode()
    // Con 5 códigos, la probabilidad de repetir es 20%
    // Ejecutar múltiples veces para verificar aleatoriedad
  })
  
  test('should throw error when no active QR codes', async () => {
    await deactivateAllQRCodes()
    await expect(selectRequiredQRCode()).rejects.toThrow()
  })
})

describe('QR Code Validation', () => {
  test('should accept correct QR code', async () => {
    const result = await validateQRCode(requiredId, scannedId)
    expect(result.isValid).toBe(true)
  })
  
  test('should reject incorrect QR code', async () => {
    const result = await validateQRCode(requiredId, differentId)
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  test('should log failed attempt', async () => {
    await validateQRCode(requiredId, wrongId)
    const attempts = await getFailedAttempts(reservationId)
    expect(attempts.length).toBeGreaterThan(0)
  })
})
```

**Frontend:**
```typescript
describe('QRScanner with Required QR', () => {
  test('should display required QR information', () => {
    render(<QRScanner requiredQR={mockRequiredQR} />)
    expect(screen.getByText(mockRequiredQR.location_name)).toBeInTheDocument()
  })
  
  test('should show error when wrong QR scanned', async () => {
    const onScan = jest.fn()
    render(<QRScanner requiredQR={mockRequiredQR} onScan={onScan} />)
    
    await simulateScan('WH-QR-001-ENTRANCE') // Wrong code
    expect(screen.getByText(/código incorrecto/i)).toBeInTheDocument()
  })
  
  test('should proceed when correct QR scanned', async () => {
    const onScan = jest.fn()
    render(<QRScanner requiredQR={mockRequiredQR} onScan={onScan} />)
    
    await simulateScan(mockRequiredQR.qr_code) // Correct code
    expect(onScan).toHaveBeenCalled()
  })
})
```

### 2. Integration Tests

```typescript
describe('Full QR Verification Flow', () => {
  test('should complete full verification flow', async () => {
    // 1. Create reservation
    const reservation = await createTestReservation()
    
    // 2. Request required QR
    const requiredQR = await getRequiredQR(reservation.id)
    expect(requiredQR).toBeDefined()
    
    // 3. Scan correct QR
    const result = await fulfillReservation(reservation.id, {
      warehouse_qr_code_id: requiredQR.id,
      required_qr_code_id: requiredQR.id
    })
    
    expect(result.success).toBe(true)
    expect(reservation.status).toBe('fulfilled')
  })
  
  test('should handle wrong QR scan gracefully', async () => {
    const reservation = await createTestReservation()
    const requiredQR = await getRequiredQR(reservation.id)
    const wrongQR = await getAnotherQR(requiredQR.id)
    
    const result = await fulfillReservation(reservation.id, {
      warehouse_qr_code_id: wrongQR.id,
      required_qr_code_id: requiredQR.id
    })
    
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('WRONG_QR_CODE')
    
    // Verify attempt was logged
    const attempts = await getFailedAttempts(reservation.id)
    expect(attempts.length).toBe(1)
  })
})
```

### 3. E2E Tests

```typescript
describe('User QR Verification Journey', () => {
  test('user can complete verification with correct QR', async () => {
    await login(testUser)
    await navigateTo('/my-reservations')
    
    // Click fulfill button
    await click('Marcar como Recogida')
    
    // Should see required QR information
    await waitFor(() => {
      expect(screen.getByText(/escanea el código ubicado en/i)).toBeVisible()
    })
    
    // Scan correct QR
    await simulateQRScan(correctQRCode)
    
    // Should see success message
    await waitFor(() => {
      expect(screen.getByText(/reserva confirmada/i)).toBeVisible()
    })
  })
  
  test('user sees helpful error when scanning wrong QR', async () => {
    await login(testUser)
    await navigateTo('/my-reservations')
    await click('Marcar como Recogida')
    
    // Scan wrong QR
    await simulateQRScan(wrongQRCode)
    
    // Should see error with helpful message
    await waitFor(() => {
      expect(screen.getByText(/código incorrecto/i)).toBeVisible()
      expect(screen.getByText(/zona de consumibles/i)).toBeVisible()
    })
  })
})
```

## Security Considerations

### 1. Prevención de Predicción

**Problema:** Usuario podría intentar predecir qué código será seleccionado.

**Solución:**
- Usar generador de números aleatorios criptográficamente seguro
- No exponer el algoritmo de selección
- Seleccionar nuevo código en cada intento

```typescript
// Backend
import crypto from 'crypto'

function selectRandomQRCode(activeQRCodes: WarehouseQR[]): WarehouseQR {
  const randomIndex = crypto.randomInt(0, activeQRCodes.length)
  return activeQRCodes[randomIndex]
}
```

### 2. Prevención de Manipulación

**Problema:** Usuario podría intentar manipular la solicitud para enviar el mismo ID en ambos campos.

**Solución:**
- Validación del lado del servidor
- Verificar que el `required_qr_code_id` fue realmente asignado a esa reserva
- Registrar timestamp de asignación y validar que no sea muy antiguo

```typescript
// Backend
async function validateQRFulfillment(reservationId, requiredId, scannedId) {
  // 1. Verificar que el required_qr_code_id fue asignado a esta reserva
  const assignment = await getQRAssignment(reservationId)
  if (!assignment || assignment.required_qr_code_id !== requiredId) {
    throw new Error('Invalid required QR code ID')
  }
  
  // 2. Verificar que la asignación no sea muy antigua (max 30 min)
  const assignmentAge = Date.now() - assignment.assigned_at
  if (assignmentAge > 30 * 60 * 1000) {
    throw new Error('QR code assignment expired')
  }
  
  // 3. Verificar que los IDs coincidan
  if (requiredId !== scannedId) {
    throw new Error('Wrong QR code scanned')
  }
  
  return true
}
```

### 3. Rate Limiting

**Problema:** Usuario podría hacer múltiples intentos rápidamente.

**Solución:**
- Limitar intentos fallidos por reserva
- Implementar cooldown después de X intentos fallidos

```typescript
// Backend
const MAX_FAILED_ATTEMPTS = 5
const COOLDOWN_PERIOD = 5 * 60 * 1000 // 5 minutos

async function checkRateLimit(reservationId: number) {
  const recentAttempts = await getRecentFailedAttempts(
    reservationId,
    COOLDOWN_PERIOD
  )
  
  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    throw new Error('Too many failed attempts. Please wait 5 minutes.')
  }
}
```

## Performance Optimization

### 1. Caching de Códigos QR Activos

```typescript
// Backend
import { cache } from '@/lib/cache'

async function getActiveQRCodes(): Promise<WarehouseQR[]> {
  const cacheKey = 'active_warehouse_qr_codes'
  
  return cache.getOrSet(cacheKey, async () => {
    return await supabase
      .from('warehouse_qr_codes')
      .select('*')
      .eq('is_active', true)
  }, 60 * 1000) // Cache por 1 minuto
}
```

### 2. Índices de Base de Datos

```sql
-- Ya existen, pero verificar:
CREATE INDEX IF NOT EXISTS idx_warehouse_qr_codes_is_active 
ON warehouse_qr_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_reservation 
ON qr_scan_attempts(reservation_id);

CREATE INDEX IF NOT EXISTS idx_qr_scan_attempts_success 
ON qr_scan_attempts(is_successful);
```

### 3. Lazy Loading de Estadísticas

```typescript
// Frontend - Solo cargar estadísticas cuando se necesiten
const { data: stats, isLoading } = useQuery(
  ['qr-stats', reservationId],
  () => fetchQRStats(reservationId),
  {
    enabled: showStats, // Solo fetch cuando el usuario lo solicite
    staleTime: 5 * 60 * 1000 // Cache por 5 minutos
  }
)
```

## Migration Strategy

### Fase 1: Preparación (Sin impacto)
1. Crear nueva tabla `qr_scan_attempts`
2. Agregar columna `required_qr_code_id` a `consumable_reservations` (nullable)
3. Crear vista `qr_scan_statistics`
4. Desplegar cambios de BD

### Fase 2: Backend (Compatible hacia atrás)
1. Crear endpoint `GET /api/reservations/[id]/required-qr`
2. Modificar endpoint `POST /api/reservations/[id]/fulfill` para aceptar ambos modos
3. Si `required_qr_code_id` no se proporciona, usar modo legacy
4. Desplegar backend

### Fase 3: Frontend (Activación gradual)
1. Modificar `MyReservationsModal` para solicitar código requerido
2. Modificar `QRScanner` para mostrar código requerido
3. Agregar feature flag para activar/desactivar nueva funcionalidad
4. Desplegar frontend

### Fase 4: Monitoreo y Ajustes
1. Monitorear tasa de intentos fallidos
2. Recopilar feedback de usuarios
3. Ajustar mensajes y UX según necesidad
4. Remover feature flag cuando esté estable

## Rollback Plan

Si es necesario revertir:

1. **Desactivar feature flag** en frontend (inmediato)
2. **Revertir frontend** a versión anterior
3. **Mantener backend** (es compatible hacia atrás)
4. **Mantener BD** (columnas nullable no afectan funcionalidad existente)

## Monitoring and Metrics

### Métricas Clave

1. **Tasa de éxito de escaneo**
   ```sql
   SELECT 
     COUNT(CASE WHEN is_successful THEN 1 END)::float / COUNT(*)::float * 100 as success_rate
   FROM qr_scan_attempts
   WHERE attempt_date >= NOW() - INTERVAL '24 hours';
   ```

2. **Promedio de intentos por reserva**
   ```sql
   SELECT AVG(attempt_count) as avg_attempts
   FROM (
     SELECT reservation_id, COUNT(*) as attempt_count
     FROM qr_scan_attempts
     GROUP BY reservation_id
   ) subquery;
   ```

3. **Códigos QR más problemáticos**
   ```sql
   SELECT 
     wq.location_name,
     COUNT(*) as failed_attempts
   FROM qr_scan_attempts qsa
   JOIN warehouse_qr_codes wq ON qsa.required_qr_code_id = wq.id
   WHERE NOT qsa.is_successful
   GROUP BY wq.location_name
   ORDER BY failed_attempts DESC;
   ```

### Alertas

- Tasa de éxito < 80% en últimas 24 horas
- Más de 10 intentos fallidos consecutivos para un usuario
- Código QR específico con tasa de fallo > 50%
- No hay códigos QR activos

## Future Enhancements

1. **Códigos QR por categoría de material**
   - Si reserva es de herramientas, requerir código de zona de herramientas
   
2. **Secuencia de códigos QR**
   - Para reservas grandes, requerir escanear múltiples códigos en orden

3. **Gamificación**
   - Puntos por escanear correctamente al primer intento
   - Badges por velocidad de localización

4. **Machine Learning**
   - Predecir qué códigos son más difíciles de encontrar
   - Sugerir mejoras en ubicación basado en datos

5. **Realidad Aumentada**
   - Guía AR para encontrar el código QR requerido
   - Flechas virtuales que apuntan a la ubicación
