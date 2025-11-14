// Reservation limits and validation
import { RESERVATION_CONFIG } from '@/config/reservations.config'

export const RESERVATION_LIMITS = {
  MAX_ACTIVE_RESERVATIONS_PER_USER: RESERVATION_CONFIG.MAX_ACTIVE_RESERVATIONS_PER_USER,
  MAX_QUANTITY_PER_ITEM: RESERVATION_CONFIG.MAX_QUANTITY_PER_ITEM,
  MAX_PERCENTAGE_OF_STOCK: RESERVATION_CONFIG.MAX_PERCENTAGE_OF_STOCK,
  MIN_DAYS_UNTIL_EXPIRATION: RESERVATION_CONFIG.MIN_DAYS_UNTIL_EXPIRATION,
  MAX_DAYS_UNTIL_EXPIRATION: RESERVATION_CONFIG.MAX_DAYS_UNTIL_EXPIRATION,
}

export interface ReservationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateReservation(params: {
  userId: number
  itemTypeId: number
  requestedQuantity: number
  availableStock: number
  currentReservedQuantity: number
  userActiveReservationsCount: number
  expirationDays: number
}): ReservationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check user's active reservations limit
  if (params.userActiveReservationsCount >= RESERVATION_LIMITS.MAX_ACTIVE_RESERVATIONS_PER_USER) {
    errors.push(
      `Has alcanzado el límite máximo de ${RESERVATION_LIMITS.MAX_ACTIVE_RESERVATIONS_PER_USER} reservas activas. ` +
      `Por favor, recoge o cancela algunas reservas antes de crear nuevas.`
    )
  }

  // Check quantity limits
  if (params.requestedQuantity <= 0) {
    errors.push('La cantidad debe ser mayor a 0')
  }

  if (params.requestedQuantity > RESERVATION_LIMITS.MAX_QUANTITY_PER_ITEM) {
    errors.push(`No puedes reservar más de ${RESERVATION_LIMITS.MAX_QUANTITY_PER_ITEM} unidades de un solo item`)
  }

  // Check available stock
  const totalAfterReservation = params.currentReservedQuantity + params.requestedQuantity
  const availableAfterReservation = params.availableStock - params.requestedQuantity

  if (params.requestedQuantity > params.availableStock) {
    errors.push(`Stock insuficiente. Disponible: ${params.availableStock} unidades`)
  }

  // Check percentage of stock
  const percentageReserved = totalAfterReservation / params.availableStock
  if (percentageReserved > RESERVATION_LIMITS.MAX_PERCENTAGE_OF_STOCK) {
    errors.push(
      `Esta reserva excedería el ${RESERVATION_LIMITS.MAX_PERCENTAGE_OF_STOCK * 100}% del stock disponible. ` +
      `Máximo permitido: ${Math.floor(params.availableStock * RESERVATION_LIMITS.MAX_PERCENTAGE_OF_STOCK)} unidades`
    )
  }

  // Warnings for low remaining stock
  if (availableAfterReservation < params.availableStock * 0.2 && availableAfterReservation > 0) {
    warnings.push(
      `Esta reserva dejará solo ${availableAfterReservation} unidades disponibles para otros usuarios`
    )
  }

  // Check expiration days
  if (params.expirationDays < RESERVATION_LIMITS.MIN_DAYS_UNTIL_EXPIRATION) {
    errors.push(`La reserva debe ser válida por al menos ${RESERVATION_LIMITS.MIN_DAYS_UNTIL_EXPIRATION} día`)
  }

  if (params.expirationDays > RESERVATION_LIMITS.MAX_DAYS_UNTIL_EXPIRATION) {
    errors.push(`La reserva no puede ser válida por más de ${RESERVATION_LIMITS.MAX_DAYS_UNTIL_EXPIRATION} días`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export function canUserCreateReservation(userActiveReservationsCount: number): boolean {
  return userActiveReservationsCount < RESERVATION_LIMITS.MAX_ACTIVE_RESERVATIONS_PER_USER
}

export function getMaxReservableQuantity(
  availableStock: number,
  currentReservedQuantity: number
): number {
  const maxByPercentage = Math.floor(availableStock * RESERVATION_LIMITS.MAX_PERCENTAGE_OF_STOCK) - currentReservedQuantity
  const maxByLimit = RESERVATION_LIMITS.MAX_QUANTITY_PER_ITEM
  
  return Math.min(Math.max(0, maxByPercentage), maxByLimit, availableStock)
}
