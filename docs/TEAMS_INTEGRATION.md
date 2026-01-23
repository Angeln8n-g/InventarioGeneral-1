# Integración con Microsoft Teams

Este documento describe cómo configurar la integración con Microsoft Teams para recibir notificaciones del sistema de inventario.

## Configuración Rápida

### 1. Crear Webhook en Teams

1. Abre Microsoft Teams
2. Ve al canal donde quieres recibir notificaciones
3. Haz clic en los tres puntos `...` junto al nombre del canal
4. Selecciona **"Conectores"** o **"Connectors"**
5. Busca **"Incoming Webhook"** y haz clic en **"Configurar"**
6. Dale un nombre (ej: "Sistema de Inventario")
7. Opcionalmente, sube un ícono personalizado
8. Haz clic en **"Crear"**
9. **Copia la URL del webhook** (la necesitarás en el siguiente paso)

### 2. Configurar Variable de Entorno

Agrega la URL del webhook a tu archivo `.env` o `.env.local`:

```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxx/IncomingWebhook/yyy/zzz
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. Reiniciar la Aplicación

Reinicia el servidor de desarrollo o redespliega la aplicación para que tome los cambios.

## Notificaciones Soportadas

| Evento | Descripción |
|--------|-------------|
| Evaluación Completada | Cuando un evaluador completa una evaluación |
| Evaluación Aprobada | Cuando se aprueba una evaluación |
| Evaluación Rechazada | Cuando se rechaza una evaluación |
| Préstamos Vencidos | Alerta de préstamos que excedieron su fecha |
| Stock Bajo | Cuando un consumible tiene stock bajo |

## Ejemplo de Notificación

Las notificaciones aparecen como tarjetas en Teams con:

- **Título** con emoji indicador
- **Mensaje** descriptivo
- **Datos** relevantes (espacio, puntuación, evaluador, etc.)
- **Botón de acción** para ir directamente al sistema

```
📋 Evaluación Completada
━━━━━━━━━━━━━━━━━━━━━━━━
Se ha completado una evaluación para Aula 101

Espacio: Aula 101
Ubicación: Edificio A, Piso 2
Evaluador: Juan Pérez
Puntuación: 85.0% 👍
Clasificación: Aceptable

[Ver Evaluación]
```

## Uso Programático

### Función Simple

```typescript
import { sendTeamsNotification } from '@/lib/teams-webhook'

await sendTeamsNotification({
  type: 'evaluation_completed',
  title: 'Evaluación Completada',
  message: 'Se completó la evaluación del Aula 101',
  facts: [
    { name: 'Espacio', value: 'Aula 101' },
    { name: 'Puntuación', value: '85%' },
  ],
  actions: [
    { name: 'Ver Detalles', url: 'https://app.example.com/evaluations/123' }
  ]
})
```

### Builder Fluido

```typescript
import { TeamsNotification } from '@/lib/teams-webhook'

await TeamsNotification
  .create('Stock Bajo')
  .type('stock_low')
  .message('El consumible **Cables HDMI** tiene stock bajo')
  .addFact('Cantidad Actual', '5')
  .addFact('Mínimo Requerido', '20')
  .addAction('Ver Inventario', '/admin/consumables')
  .send()
```

### Funciones de Conveniencia

```typescript
import { 
  notifyEvaluationCompleted,
  notifyEvaluationApproval,
  notifyOverdueLoans,
  notifyLowStock 
} from '@/lib/teams-webhook'

// Evaluación completada
await notifyEvaluationCompleted({
  classroomName: 'Aula 101',
  location: 'Edificio A',
  evaluator: 'Juan Pérez',
  scorePercentage: 85,
  classification: 'acceptable',
  evaluationId: 123
})

// Evaluación aprobada/rechazada
await notifyEvaluationApproval({
  classroomName: 'Aula 101',
  approved: true,
  approver: 'María García',
  comments: 'Buen trabajo'
})

// Préstamos vencidos
await notifyOverdueLoans({
  count: 3,
  loans: [
    { userName: 'Pedro', toolName: 'Taladro', dueDate: '2025-01-20' }
  ]
})

// Stock bajo
await notifyLowStock({
  itemName: 'Cables HDMI',
  currentQuantity: 5,
  minimumQuantity: 20
})
```

## Tipos de Notificación y Colores

| Tipo | Color | Emoji |
|------|-------|-------|
| `evaluation_completed` | Azul | 📋 |
| `evaluation_approved` | Verde | ✅ |
| `evaluation_rejected` | Rojo | ❌ |
| `loan_overdue` | Amarillo | ⚠️ |
| `loan_created` | Azul | 🔧 |
| `loan_returned` | Verde | ✅ |
| `stock_low` | Amarillo | 📦 |
| `reservation_created` | Azul | 📅 |
| `reservation_fulfilled` | Verde | ✅ |
| `general` | Rojo Claro | 📢 |

## Solución de Problemas

### Las notificaciones no llegan

1. Verifica que `TEAMS_WEBHOOK_URL` esté configurado correctamente
2. Revisa los logs del servidor para errores `[Teams Webhook]`
3. Asegúrate de que el webhook no haya sido eliminado en Teams

### Error "Invalid webhook URL"

- La URL debe comenzar con `https://outlook.office.com/webhook/`
- Verifica que no haya espacios o caracteres extra

### Los botones no funcionan

- Asegúrate de que `NEXT_PUBLIC_APP_URL` esté configurado
- La URL debe ser accesible desde internet (no localhost en producción)

## Seguridad

- La URL del webhook es sensible, no la compartas públicamente
- Usa variables de entorno, nunca hardcodees la URL
- Si sospechas que la URL fue comprometida, elimina el webhook en Teams y crea uno nuevo
