/**
 * Microsoft Teams Webhook Integration
 * 
 * Este módulo permite enviar notificaciones al sistema de inventario
 * a través de webhooks de Microsoft Teams.
 * 
 * Configuración:
 * 1. En Teams, ve al canal donde quieres recibir notificaciones
 * 2. Click en "..." > "Connectors" > "Incoming Webhook"
 * 3. Configura el nombre y copia la URL del webhook
 * 4. Agrega la URL a tu archivo .env como TEAMS_WEBHOOK_URL
 */

// Colores para diferentes tipos de notificaciones
export const TEAMS_COLORS = {
  success: '28A745',   // Verde
  warning: 'FFC107',   // Amarillo
  error: 'DC3545',     // Rojo
  info: '0078D4',      // Azul (Teams)
  primary: 'DA291C',   // Rojo Claro (marca)
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
}

/**
 * Configuración por tipo de notificación
 */
const NOTIFICATION_CONFIG: Record<TeamsNotificationType, TeamsNotificationConfig> = {
  evaluation_completed: { color: 'info', emoji: '📋' },
  evaluation_approved: { color: 'success', emoji: '✅' },
  evaluation_rejected: { color: 'error', emoji: '❌' },
  loan_overdue: { color: 'warning', emoji: '⚠️' },
  loan_created: { color: 'info', emoji: '🔧' },
  loan_returned: { color: 'success', emoji: '✅' },
  stock_low: { color: 'warning', emoji: '📦' },
  reservation_created: { color: 'info', emoji: '📅' },
  reservation_fulfilled: { color: 'success', emoji: '✅' },
  general: { color: 'primary', emoji: '📢' },
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
 * Formato de MessageCard para Teams
 * @see https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference
 */
interface TeamsMessageCard {
  '@type': 'MessageCard'
  '@context': 'http://schema.org/extensions'
  themeColor: string
  summary: string
  sections: Array<{
    activityTitle: string
    activitySubtitle?: string
    activityImage?: string
    facts?: Array<{ name: string; value: string }>
    text?: string
    markdown: boolean
  }>
  potentialAction?: Array<{
    '@type': 'OpenUri'
    name: string
    targets: Array<{ os: 'default'; uri: string }>
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
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
}

/**
 * Construye el payload de MessageCard para Teams
 */
function buildMessageCard(options: TeamsNotificationOptions): TeamsMessageCard {
  const config = NOTIFICATION_CONFIG[options.type || 'general']
  const color = options.color ? TEAMS_COLORS[options.color] : TEAMS_COLORS[config.color]
  
  const card: TeamsMessageCard = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color,
    summary: options.title,
    sections: [
      {
        activityTitle: `${config.emoji} ${options.title}`,
        text: options.message,
        markdown: true,
      },
    ],
  }

  // Agregar facts si existen
  if (options.facts && options.facts.length > 0) {
    card.sections[0].facts = options.facts
  }

  // Agregar acciones si existen
  if (options.actions && options.actions.length > 0) {
    card.potentialAction = options.actions.map(action => ({
      '@type': 'OpenUri' as const,
      name: action.name,
      targets: [{ os: 'default' as const, uri: action.url }],
    }))
  }

  return card
}

/**
 * Envía una notificación a Microsoft Teams
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
    const payload = buildMessageCard(options)

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

  return TeamsNotification
    .create('Evaluación Completada')
    .type('evaluation_completed')
    .message(`Se ha completado una evaluación para **${data.classroomName}**`)
    .addFact('Espacio', data.classroomName)
    .addFact('Ubicación', data.location)
    .addFact('Evaluador', data.evaluator)
    .addFact('Puntuación', `${data.scorePercentage.toFixed(1)}% ${classificationEmoji}`)
    .addFact('Clasificación', data.classification === 'excellent' ? 'Excelente' : 
             data.classification === 'acceptable' ? 'Aceptable' : 'Requiere Atención')
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
  
  const notification = TeamsNotification
    .create(title)
    .type(type)
    .message(`La evaluación de **${data.classroomName}** ha sido ${data.approved ? 'aprobada' : 'rechazada'}`)
    .addFact('Espacio', data.classroomName)
    .addFact('Aprobador', data.approver)

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
    .map(l => `- ${l.toolName} (${l.userName}) - Vencido: ${l.dueDate}`)
    .join('\n')

  return TeamsNotification
    .create(`⚠️ ${data.count} Préstamo(s) Vencido(s)`)
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
    .addAction('Ver Inventario', `/admin/consumables`)
    .send()
}
