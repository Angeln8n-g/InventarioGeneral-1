import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase configuration missing. Some features may not work.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: number
                    username: string
                    email: string
                    role: string
                    created_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    username: string
                    email: string
                    password_hash: string
                    role?: string
                }
                Update: {
                    username?: string
                    email?: string
                    role?: string
                    updated_at?: string
                    version?: number
                }
            }
            item_types: {
                Row: {
                    id: number
                    name: string
                    description: string | null
                    category: string | null
                    is_consumable: boolean
                    default_loan_duration_days: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    name: string
                    description?: string
                    category?: string
                    is_consumable?: boolean
                    default_loan_duration_days?: number
                }
                Update: {
                    name?: string
                    description?: string
                    category?: string
                    is_consumable?: boolean
                    default_loan_duration_days?: number
                    updated_at?: string
                }
            }
            tool_instances: {
                Row: {
                    id: number
                    item_type_id: number
                    qr_code: string
                    serial_number: string | null
                    status: string
                    condition_notes: string | null
                    created_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    item_type_id: number
                    qr_code: string
                    serial_number?: string
                    status?: string
                    condition_notes?: string
                }
                Update: {
                    item_type_id?: number
                    qr_code?: string
                    serial_number?: string
                    status?: string
                    condition_notes?: string
                    updated_at?: string
                    version?: number
                }
            }
            loans: {
                Row: {
                    id: number
                    user_id: number
                    tool_instance_id: number
                    loan_date: string
                    due_date: string
                    return_date: string | null
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: number
                    tool_instance_id: number
                    due_date: string
                    loan_date?: string
                    status?: string
                    notes?: string
                }
                Update: {
                    return_date?: string
                    status?: string
                    notes?: string
                    updated_at?: string
                }
            }
            consumable_stock: {
                Row: {
                    id: number
                    item_type_id: number
                    current_quantity: number
                    minimum_threshold: number
                    unit_of_measure: string | null
                    created_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    item_type_id: number
                    current_quantity?: number
                    minimum_threshold?: number
                    unit_of_measure?: string
                }
                Update: {
                    current_quantity?: number
                    minimum_threshold?: number
                    unit_of_measure?: string
                    updated_at?: string
                    version?: number
                }
            }
            consumable_requests: {
                Row: {
                    id: number
                    user_id: number
                    item_type_id: number
                    requested_quantity: number
                    fulfilled_quantity: number
                    status: string
                    request_date: string
                    fulfilled_date: string | null
                    notes: string | null
                }
                Insert: {
                    user_id: number
                    item_type_id: number
                    requested_quantity: number
                    status?: string
                    notes?: string
                }
                Update: {
                    fulfilled_quantity?: number
                    status?: string
                    fulfilled_date?: string
                    notes?: string
                }
            }
            notifications: {
                Row: {
                    id: number
                    user_id: number
                    type: string
                    title: string
                    message: string
                    is_read: boolean
                    delivery_status: string
                    created_at: string
                    read_at: string | null
                    delivered_at: string | null
                }
                Insert: {
                    user_id: number
                    type: string
                    title: string
                    message: string
                    delivery_status?: string
                }
                Update: {
                    is_read?: boolean
                    delivery_status?: string
                    read_at?: string
                    delivered_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: number
                    user_id: number | null
                    action: string
                    entity_type: string
                    entity_id: number
                    old_values: Record<string, unknown> | null
                    new_values: Record<string, unknown> | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    user_id?: number
                    action: string
                    entity_type: string
                    entity_id: number
                    old_values?: Record<string, unknown> | null
                    new_values?: Record<string, unknown> | null
                    ip_address?: string
                    user_agent?: string
                }
                Update: never
            }
        }
    }
}