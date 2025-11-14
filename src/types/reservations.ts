// Types for consumable reservations

export type ReservationStatus = 'active' | 'fulfilled' | 'cancelled' | 'expired'

export interface ConsumableReservation {
  id: number
  user_id: number
  item_type_id: number
  reserved_quantity: number
  status: ReservationStatus
  reservation_date: string
  expiration_date: string
  pickup_date: string | null
  notes: string | null
  purpose: string | null
  created_at: string
  updated_at: string
}

export interface ReservationDetails extends ConsumableReservation {
  username: string
  email: string
  item_name: string
  item_category: string | null
  unit_of_measure: string | null
  days_until_expiration: number
  is_expired: boolean
}

export interface CreateReservationInput {
  item_type_id: number
  reserved_quantity: number
  expiration_date: string
  notes?: string
  purpose?: string
}

export interface UpdateReservationInput {
  status?: ReservationStatus
  pickup_date?: string
  notes?: string
}

export interface ReservationFilters {
  user_id?: number
  item_type_id?: number
  status?: ReservationStatus
  expiring_soon?: boolean // Within 24 hours
}

export interface ReservationStats {
  total_active: number
  total_fulfilled: number
  total_cancelled: number
  total_expired: number
  expiring_soon: number // Within 24 hours
  my_active: number
}
