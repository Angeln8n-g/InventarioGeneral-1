/**
 * Configuración centralizada del sistema de reservas
 * Modifica estos valores según las necesidades de tu organización
 */

export const RESERVATION_CONFIG = {
  // Límites de reservas
  MAX_ACTIVE_RESERVATIONS_PER_USER: 5,
  MAX_QUANTITY_PER_ITEM: 50,
  MAX_PERCENTAGE_OF_STOCK: 0.5,
  MIN_DAYS_UNTIL_EXPIRATION: 1,
  MAX_DAYS_UNTIL_EXPIRATION: 3,
  DEFAULT_RESERVATION_DAYS: 7,

  // Notificaciones
  URGENT_NOTIFICATION_HOURS: 24,
  WARNING_NOTIFICATION_DAYS: 3,
  REMINDER_NOTIFICATION_DAYS: 7,

  // UI/UX
  QUICK_DURATION_OPTIONS: [1, 3, 7],
  LOW_STOCK_WARNING_THRESHOLD: 0.2,
  MAX_RESERVATIONS_DISPLAY: 3,

  // Reportes
  TOP_ITEMS_LIMIT: 10,
  PDF_EXPORT_LIMIT: 50,
  EXPORT_DATE_LOCALE: 'es-ES' as const,

  // Métricas
  GOOD_FULFILLMENT_RATE: 80,
  FAIR_FULFILLMENT_RATE: 50,

  // Características
  ALLOW_USER_CANCELLATION: true,
  ALLOW_USER_FULFILLMENT: true,
  REQUIRE_PURPOSE: false,
}

export function getReservationConfig() {
  return RESERVATION_CONFIG
}
