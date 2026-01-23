# Integración con Microsoft Teams (Power Automate Workflows)

Este documento describe cómo configurar la integración con Microsoft Teams para recibir notificaciones del sistema de inventario usando **Power Automate Workflows**.

> **Nota**: Microsoft está deprecando los Office 365 Connectors (webhooks tradicionales). Esta implementación usa **Adaptive Cards** compatible con Power Automate Workflows.

## Configuración Rápida

### 1. Crear Workflow en Teams

1. Abre **Microsoft Teams**
2. Ve al canal donde quieres recibir notificaciones
3. Haz clic en los tres puntos `...` junto al nombre del canal
4. Selecciona **"Workflows"** (o "Flujos de trabajo")
5. Busca **"Post to a channel when a webhook request is received"** (Publicar en un canal cuando se recibe una solicitud de webhook)
6. Haz clic en **"Add workflow"** (Agregar flujo de trabajo)
7. Dale un nombre descriptivo (ej: "Notificaciones Sistema Inventario")
8. Selecciona el canal donde se publicarán las notificaciones
9. Haz clic en **"Add workflow"**
10. **Copia la URL del webhook** que se genera (la necesitarás en el siguiente paso)

### 2. Configurar Variable de Entorno

Agrega la URL del webhook a tu archivo `.env` o `.env.local`:

```env
# URL del Workflow de Power Automate
TEAMS_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com:443/workflows/...

# URL de tu aplicación (para los botones de acción)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. Reiniciar la Aplicación

Reinicia el servidor de desarrollo o redespliega la aplicación para que tome los cambios.

## Notificaciones Soportadas

| Evento | Descripción | Color |
|--------|-------------|-------|
| Evaluación Completada | Cuando un evaluador completa una evaluación | 🔵 Azul |
| Evaluación Aprobada | Cuando se aprueba una evaluación | 🟢 Verde |
| Evaluación Rechazada | Cuando se rechaza una evaluación | 🔴 Rojo |
| Préstamos Vencidos | Alerta de préstamos que excedieron su fecha | 🟡 Amarillo |
| Stock Bajo | Cuando un consumible tiene stock bajo | 🟡 Amarillo |

## Ejemplo de Notificación (Adaptive Card)

Las notificaciones aparecen como tarjetas adaptativas en Teams con:

- **Título** con emoji indicador y color según el tipo
- **Mensaje** descriptivo
- **Datos** relevantes en formato de tabla (espacio, puntuación, evaluador, etc.)
- **Botón de acción** para ir directamente al sistema

```
┌─────────────────────────────────────────┐
│ 📋 Evaluación Completada                │
├─────────────────────────────────────────┤
│ Se ha completado una evaluación para    │
│ Aula 101                                │
│                                         │
│ Espacio:        Aula 101                │
│ Ubicación:      Edificio A, Piso 2      │
│ Evaluador:      Juan Pérez              │
│ Puntuación:     85.0% 👍                │
│ Clasificación:  Aceptable               │
│                                         │
│ [Ver Evaluación]                        │
└─────────────────────────────────────────┘
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

## Tipos de Notificación y Estilos

| Tipo | Estilo | Emoji |
|------|--------|-------|
| `evaluation_completed` | Accent (Azul) | 📋 |
| `evaluation_approved` | Good (Verde) | ✅ |
| `evaluation_rejected` | Attention (Rojo) | ❌ |
| `loan_overdue` | Warning (Amarillo) | ⚠️ |
| `loan_created` | Accent (Azul) | 🔧 |
| `loan_returned` | Good (Verde) | ✅ |
| `stock_low` | Warning (Amarillo) | 📦 |
| `reservation_created` | Accent (Azul) | 📅 |
| `reservation_fulfilled` | Good (Verde) | ✅ |
| `general` | Default | 📢 |

## Diferencias con Office 365 Connectors

| Característica | Office 365 Connectors (Antiguo) | Power Automate Workflows (Nuevo) |
|----------------|--------------------------------|----------------------------------|
| Formato | MessageCard | Adaptive Card |
| Estado | Deprecado | Recomendado |
| Canales privados | Soportado | No soportado (limitación conocida) |
| Personalización | Limitada | Más flexible |
| Seguridad | Básica | Mejorada |

## Solución de Problemas

### Las notificaciones no llegan

1. Verifica que `TEAMS_WEBHOOK_URL` esté configurado correctamente
2. La URL debe comenzar con `https://prod-` o similar (formato de Logic Apps)
3. Revisa los logs del servidor para errores `[Teams Webhook]`
4. Verifica que el Workflow esté activo en Power Automate

### Error "Invalid webhook URL"

- La URL debe ser la generada por Power Automate
- Verifica que no haya espacios o caracteres extra
- Asegúrate de copiar la URL completa

### Los botones no funcionan

- Asegúrate de que `NEXT_PUBLIC_APP_URL` esté configurado
- La URL debe ser accesible desde internet (no localhost en producción)
- Verifica que la URL no tenga errores tipográficos

### No se puede publicar en canales privados

Esta es una limitación conocida de Power Automate Workflows:
- Los Workflows solo pueden publicar en canales públicos
- Para canales privados, considera usar un Bot de Teams

### El Workflow se desactiva

- Los Workflows están vinculados a usuarios específicos
- Si el propietario deja la organización, el Workflow puede desactivarse
- Solución: Agregar co-propietarios al Workflow

## Verificar el Workflow

Para probar que el Workflow funciona:

1. Ve a [Power Automate](https://make.powerautomate.com/)
2. Busca tu Workflow en "Mis flujos"
3. Haz clic en "Ejecutar" para probar manualmente
4. O usa este comando curl:

```bash
curl -X POST "TU_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message",
    "attachments": [{
      "contentType": "application/vnd.microsoft.card.adaptive",
      "contentUrl": null,
      "content": {
        "type": "AdaptiveCard",
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.4",
        "body": [{
          "type": "TextBlock",
          "text": "🧪 Prueba de Notificación",
          "weight": "Bolder",
          "size": "Large"
        }, {
          "type": "TextBlock",
          "text": "Si ves este mensaje, la integración funciona correctamente."
        }]
      }
    }]
  }'
```

## Seguridad

- La URL del webhook es sensible, no la compartas públicamente
- Usa variables de entorno, nunca hardcodees la URL
- Si sospechas que la URL fue comprometida:
  1. Ve a Power Automate
  2. Elimina el Workflow actual
  3. Crea uno nuevo con una URL diferente
  4. Actualiza la variable de entorno

## Recursos Adicionales

- [Documentación de Adaptive Cards](https://adaptivecards.io/)
- [Designer de Adaptive Cards](https://adaptivecards.io/designer/)
- [Power Automate para Teams](https://learn.microsoft.com/en-us/power-automate/teams/overview)
- [Webhooks en Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
