/**
 * Microsoft Teams Webhook Integration (Power Automate Workflows)
 * 
 * Este módulo permite enviar notificaciones al sistema de inventario
 * a través de Power Automate Workflows en Microsoft Teams.
 * 
 * IMPORTANTE: Microsoft está deprecando los Office 365 Connectors.
 * Esta implementación usa Adaptive Cards, compatible con Power Automate.
 * 
 * Configuración:
 * 1. En Teams, ve al canal donde quieres recibir notificaciones
 * 2. Click en "..." > "Workflows" > "Create a workflow"
 * 3. Busca "Post to a channel when a webhook request is received"
 * 4. Configura el workflow y copia la URL del webhook
 * 5. Agrega la URL a tu archivo .env como TEAMS_WEBHOOK_URL
 * 
 * @see https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook
 */

// Colores para diferentes tipos de notificaciones (formato hex para Adaptive Cards)
export const TEAMS_COLORS = {
  success: 'good',      // Verde
  warning: 'warning',   // Amarillo
  error: 'attention',   // Rojo
  info: 'accent',       // Azul
  primary: 'accent',    // Azul (marca)
} as const

export type TeamsColor = keyof typeof TEAMS_COLORS

/**
 * Tipos de notificaciones soportadas
 */
export type TeamsNotificationType = 
  | 'evaluation_completed'
  | 'evaluation_approved'
  | 'evaluation_rejected'
  | 'loan_overdue'
  | 'loan_created'
  | 'loan_returned'
  | 'stock_low'
  | 'reservation_created'
  | 'reservation_fulfilled'
  | 'general'

/**
 * Configuración de notificación
 */
interface TeamsNotificationConfig {
  color: TeamsColor
  emoji: string
  style: 'good' | 'warning' | 'attention' | 'accent' | 'default'
}

/**
 * Configuración por tipo de notificación
 */
const NOTIFICATION_CONFIG: Record<TeamsNotificationType, TeamsNotificationConfig> = {
  evaluation_completed: { color: 'info', emoji: '📋', style: 'accent' },
  evaluation_approved: { color: 'success', emoji: '✅', style: 'good' },
  evaluation_rejected: { color: 'error', emoji: '❌', style: 'attention' },
  loan_overdue: { color: 'warning', emoji: '⚠️', style: 'warning' },
  loan_created: { color: 'info', emoji: '🔧', style: 'accent' },
  loan_returned: { color: 'success', emoji: '✅', style: 'good' },
  stock_low: { color: 'warning', emoji: '📦', style: 'warning' },
  reservation_created: { color: 'info', emoji: '📅', style: 'accent' },
  reservation_fulfilled: { color: 'success', emoji: '✅', style: 'good' },
  general: { color: 'primary', emoji: '📢', style: 'default' },
}

/**
 * Interfaz para una acción en la tarjeta de Teams
 */
interface TeamsAction {
  name: string
  url: string
}

/**
 * Interfaz para un hecho (key-value) en la tarjeta
 */
interface TeamsFact {
  name: string
  value: string
}

/**
 * Opciones para enviar una notificación a Teams
 */
export interface TeamsNotificationOptions {
  /** Tipo de notificación (determina color y emoji) */
  type?: TeamsNotificationType
  /** Título de la notificación */
  title: string
  /** Mensaje principal */
  message: string
  /** Datos adicionales como key-value */
  facts?: TeamsFact[]
  /** Botones de acción */
  actions?: TeamsAction[]
  /** Color personalizado (override del tipo) */
  color?: TeamsColor
  /** URL del webhook (si no se usa el default) */
  webhookUrl?: string
}

/**
 * Adaptive Card element types
 */
interface AdaptiveCardTextBlock {
  type: 'TextBlock'
  text: string
  weight?: 'Default' | 'Lighter' | 'Bolder'
  size?: 'Default' | 'Small' | 'Medium' | 'Large' | 'ExtraLarge'
  color?: 'Default' | 'Dark' | 'Light' | 'Accent' | 'Good' | 'Warning' | 'Attention'
  wrap?: boolean
  spacing?: 'None' | 'Small' | 'Default' | 'Medium' | 'Large' | 'ExtraLarge'
}

interface AdaptiveCardFactSet {
  type: 'FactSet'
  facts: Array<{ title: string; value: string }>
  spacing?: 'None' | 'Small' | 'Default' | 'Medium' | 'Large' | 'ExtraLarge'
}

interface AdaptiveCardActionOpenUrl {
  type: 'Action.OpenUrl'
  title: string
  url: string
  style?: 'default' | 'positive' | 'destructive'
}

interface AdaptiveCardContainer {
  type: 'Container'
  items: Array<AdaptiveCardTextBlock | AdaptiveCardFactSet>
  style?: 'default' | 'emphasis' | 'good' | 'attention' | 'warning' | 'accent'
  bleed?: boolean
  spacing?: 'None' | 'Small' | 'Default' | 'Medium' | 'Large' | 'ExtraLarge'
}

/**
 * Adaptive Card format for Power Automate Workflows
 * @see https://adaptivecards.io/explorer/
 */
interface AdaptiveCard {
  type: 'AdaptiveCard'
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
  version: '1.4'
  body: Array<AdaptiveCardTextBlock | AdaptiveCardFactSet | AdaptiveCardContainer>
  actions?: AdaptiveCardActionOpenUrl[]
  msteams?: {
    width: 'Full'
  }
}

/**
 * Wrapper for Power Automate Workflow webhook
 */
interface PowerAutomatePayload {
  type: 'message'
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive'
    contentUrl: null
    content: AdaptiveCard
  }>
}

/**
 * Obtiene la URL del webhook de Teams desde las variables de entorno
 */
function getWebhookUrl(): string | null {
  return process.env.TEAMS_WEBHOOK_URL || null
}

/**
 * Obtiene la URL base de la aplicación
 */
function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Mapea el estilo de notificación al color de Adaptive Card
 */
function getAdaptiveCardColor(style: string): AdaptiveCardTextBlock['color'] {
  const colorMap: Record<string, AdaptiveCardTextBlock['color']> = {
    good: 'Good',
    warning: 'Warning',
    attention: 'Attention',
    accent: 'Accent',
    default: 'Default',
  }
  return colorMap[style] || 'Default'
}

/**
 * Construye el payload de texto simple para Power Automate
 * Este formato es más compatible con los workflows de Teams
 */
function buildTextPayload(options: TeamsNotificationOptions): { text: string } {
  const config = NOTIFICATION_CONFIG[options.type || 'general']
  
  // Construir mensaje con formato de texto
  let text = `${config.emoji} **${options.title}**\n\n`
  text += `${options.message}\n`

  // Agregar facts como lista
  if (options.facts && options.facts.length > 0) {
    text += '\n'
    for (const fact of options.facts) {
      text += `• **${fact.name}:** ${fact.value}\n`
    }
  }

  // Agregar enlaces de acciones
  if (options.actions && options.actions.length > 0) {
    text += '\n'
    for (const action of options.actions) {
      text += `🔗 [${action.name}](${action.url})\n`
    }
  }

  return { text }
}

/**
 * Envía una notificación a Microsoft Teams via Power Automate Workflow
 * 
 * @param options - Opciones de la notificación
 * @returns true si se envió correctamente, false si falló o no está configurado
 * 
 * @example
 * ```typescript
 * await sendTeamsNotification({
 *   type: 'evaluation_completed',
 *   title: 'Evaluación Completada',
 *   message: 'Se ha completado la evaluación del Aula 101',
 *   facts: [
 *     { name: 'Espacio', value: 'Aula 101' },
 *     { name: 'Puntuación', value: '85%' },
 *     { name: 'Evaluador', value: 'Juan Pérez' },
 *   ],
 *   actions: [
 *     { name: 'Ver Detalles', url: 'https://app.example.com/evaluations/123' }
 *   ]
 * })
 * ```
 */
export async function sendTeamsNotification(
  options: TeamsNotificationOptions
): Promise<boolean> {
  const webhookUrl = options.webhookUrl || getWebhookUrl()

  if (!webhookUrl) {
    console.log('[Teams Webhook] No webhook URL configured, skipping notification')
    return false
  }

  try {
    const payload = buildTextPayload(options)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Teams Webhook] Error sending notification:', response.status, errorText)
      return false
    }

    console.log('[Teams Webhook] Notification sent successfully:', options.title)
    return true
  } catch (error) {
    console.error('[Teams Webhook] Error sending notification:', error)
    return false
  }
}

/**
 * Clase helper para construir notificaciones de Teams de forma fluida
 * 
 * @example
 * ```typescript
 * await TeamsNotification
 *   .create('Evaluación Completada')
 *   .type('evaluation_completed')
 *   .message('Se completó la evaluación del Aula 101')
 *   .addFact('Puntuación', '85%')
 *   .addFact('Evaluador', 'Juan Pérez')
 *   .addAction('Ver Detalles', '/admin/evaluations/123')
 *   .send()
 * ```
 */
export class TeamsNotification {
  private options: TeamsNotificationOptions

  private constructor(title: string) {
    this.options = {
      title,
      message: '',
      facts: [],
      actions: [],
    }
  }

  static create(title: string): TeamsNotification {
    return new TeamsNotification(title)
  }

  type(type: TeamsNotificationType): TeamsNotification {
    this.options.type = type
    return this
  }

  message(message: string): TeamsNotification {
    this.options.message = message
    return this
  }

  color(color: TeamsColor): TeamsNotification {
    this.options.color = color
    return this
  }

  addFact(name: string, value: string): TeamsNotification {
    if (!this.options.facts) this.options.facts = []
    this.options.facts.push({ name, value })
    return this
  }

  addAction(name: string, path: string): TeamsNotification {
    if (!this.options.actions) this.options.actions = []
    const baseUrl = getAppBaseUrl()
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`
    this.options.actions.push({ name, url })
    return this
  }

  webhookUrl(url: string): TeamsNotification {
    this.options.webhookUrl = url
    return this
  }

  async send(): Promise<boolean> {
    return sendTeamsNotification(this.options)
  }
}

// ============================================
// FUNCIONES DE CONVENIENCIA PARA CASOS COMUNES
// ============================================

/**
 * Notifica cuando se completa una evaluación
 */
export async function notifyEvaluationCompleted(data: {
  classroomName: string
  location: string
  evaluator: string
  scorePercentage: number
  classification: string
  evaluationId: number
}): Promise<boolean> {
  const classificationEmoji = 
    data.classification === 'excellent' ? '🌟' :
    data.classification === 'acceptable' ? '👍' : '⚠️'

  const classificationLabel = 
    data.classification === 'excellent' ? 'Excelente' : 
    data.classification === 'acceptable' ? 'Aceptable' : 'Requiere Atención'

  return TeamsNotification
    .create('Evaluación Completada')
    .type('evaluation_completed')
    .message(`Se ha completado una evaluación para **${data.classroomName}**`)
    .addFact('Espacio', data.classroomName)
    .addFact('Ubicación', data.location || 'No especificada')
    .addFact('Evaluador', data.evaluator)
    .addFact('Puntuación', `${data.scorePercentage.toFixed(1)}% ${classificationEmoji}`)
    .addFact('Clasificación', classificationLabel)
    .addAction('Ver Evaluación', `/admin/classrooms/evaluations`)
    .send()
}

/**
 * Notifica cuando una evaluación es aprobada o rechazada
 */
export async function notifyEvaluationApproval(data: {
  classroomName: string
  approved: boolean
  approver: string
  comments?: string
}): Promise<boolean> {
  const type = data.approved ? 'evaluation_approved' : 'evaluation_rejected'
  const title = data.approved ? 'Evaluación Aprobada' : 'Evaluación Rechazada'
  const statusText = data.approved ? 'aprobada' : 'rechazada'
  
  const notification = TeamsNotification
    .create(title)
    .type(type)
    .message(`La evaluación de **${data.classroomName}** ha sido ${statusText}`)
    .addFact('Espacio', data.classroomName)
    .addFact('Aprobador', data.approver)
    .addFact('Estado', data.approved ? '✅ Aprobada' : '❌ Rechazada')

  if (data.comments) {
    notification.addFact('Comentarios', data.comments)
  }

  return notification
    .addAction('Ver Detalles', `/admin/classrooms/evaluations?tab=aprobaciones`)
    .send()
}

/**
 * Notifica cuando hay préstamos vencidos
 */
export async function notifyOverdueLoans(data: {
  count: number
  loans: Array<{ userName: string; toolName: string; dueDate: string }>
}): Promise<boolean> {
  const loansList = data.loans
    .slice(0, 5) // Máximo 5 para no hacer el mensaje muy largo
    .map(l => `• ${l.toolName} (${l.userName}) - Vencido: ${l.dueDate}`)
    .join('\n')

  return TeamsNotification
    .create(`${data.count} Préstamo(s) Vencido(s)`)
    .type('loan_overdue')
    .message(`Hay **${data.count}** préstamo(s) que han excedido su fecha de devolución:\n\n${loansList}`)
    .addFact('Total Vencidos', data.count.toString())
    .addAction('Ver Préstamos', `/admin/loans?status=overdue`)
    .send()
}

/**
 * Notifica cuando el stock de un consumible está bajo
 */
export async function notifyLowStock(data: {
  itemName: string
  currentQuantity: number
  minimumQuantity: number
}): Promise<boolean> {
  return TeamsNotification
    .create('Stock Bajo')
    .type('stock_low')
    .message(`El consumible **${data.itemName}** tiene stock bajo`)
    .addFact('Artículo', data.itemName)
    .addFact('Cantidad Actual', data.currentQuantity.toString())
    .addFact('Mínimo Requerido', data.minimumQuantity.toString())
    .addFact('Estado', '⚠️ Requiere reabastecimiento')
    .addAction('Ver Inventario', `/admin/consumables`)
    .send()
}
