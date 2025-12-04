// Phase 1, Task 1: Shared types and interfaces for consumables

export interface ConsumableStock {
  is_available: boolean
  is_low_stock: boolean
  current_quantity: number
  unit_of_measure?: string
  minimum_threshold?: number
}

export interface ConsumableItem {
  id: number
  name: string
  description?: string
  category?: string
  stock?: ConsumableStock
}

export interface ConsumableStockAdmin {
  id: number
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
  }
  current_quantity: number
  minimum_threshold: number
  unit_of_measure?: string
  qr_code?: string
  is_low_stock: boolean
}

export interface BackorderRequest {
  id: number
  user: { username: string; email: string }
  item_type: { name: string; id: number }
  requested_quantity: number
  request_date: string
}

export interface ConsumableFilters {
  search: string
  category: string
  lowStockOnly: boolean
}

export type UserRole = 'user' | 'admin'

export type StockAdjustmentAction = 'adjust' | 'set' | 'restock'

export interface CartItem {
  id: number
  name: string
  description?: string
  category?: string
  unit_of_measure?: string
  available_stock: number
  quantity: number
  // Cable markers for items measured in meters/feet
  start_marker?: number
  end_marker?: number
}
