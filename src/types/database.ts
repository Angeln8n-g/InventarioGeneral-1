// Database entity types
export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
  version: number
}

export interface ItemType {
  id: number
  name: string
  description: string | null
  category: string | null
  is_consumable: boolean
  default_loan_duration_days: number
  created_at: string
  updated_at: string
}

export interface ToolInstance {
  id: number
  item_type_id: number
  qr_code: string
  serial_number: string | null
  status: 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'
  condition_notes: string | null
  created_at: string
  updated_at: string
  version: number
  item_type?: ItemType
  current_loan?: Loan
}

export interface ConsumableStock {
  id: number
  item_type_id: number
  current_quantity: number
  minimum_threshold: number
  unit_of_measure: string | null
  created_at: string
  updated_at: string
  version: number
  item_type?: ItemType
}

export interface Loan {
  id: number
  user_id: number
  tool_instance_id: number
  loan_date: string
  due_date: string
  return_date: string | null
  status: 'active' | 'returned' | 'overdue' | 'lost'
  notes: string | null
  created_at: string
  updated_at: string
  user?: User
  tool_instance?: ToolInstance
}

export interface ConsumableRequest {
  id: number
  user_id: number
  item_type_id: number
  requested_quantity: number
  fulfilled_quantity: number
  status: 'pending' | 'fulfilled' | 'partial' | 'cancelled'
  request_date: string
  fulfilled_date: string | null
  notes: string | null
  user?: User
  item_type?: ItemType
}

export interface StockMovement {
  id: number
  consumable_stock_id: number
  movement_type: 'consumption' | 'adjustment' | 'restock' | 'loss' | 'damage' | 'return'
  quantity: number
  user_id: number | null
  notes: string | null
  created_at: string
  // Cable marker fields (for cable-type consumables)
  start_marker: number | null
  end_marker: number | null
  // Relations
  user?: User
  consumable_stock?: ConsumableStock
}

export interface ConsumableReturn {
  id: number
  user_id: number
  item_type_id: number
  consumable_stock_id: number
  returned_quantity: number
  original_consumption_date: string
  return_date: string
  notes: string | null
  status: 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  // Cable segment fields (for cable-type consumables)
  segment_start: number | null
  segment_end: number | null
  // Relations
  user?: User
  item_type?: ItemType
  consumable_stock?: ConsumableStock
}

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  delivery_status: 'pending' | 'delivered' | 'failed'
  created_at: string
  read_at: string | null
  delivered_at: string | null
}

export interface AuditLog {
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
  user?: User
}

// Input types for creating/updating entities
export interface CreateUserInput {
  username: string
  email: string
  password_hash: string
  full_name: string
  role?: 'user' | 'admin'
}

export interface UpdateUserInput {
  username?: string
  email?: string
  full_name?: string
  role?: 'user' | 'admin'
}

export interface CreateItemTypeInput {
  name: string
  description?: string
  category?: string
  is_consumable?: boolean
  default_loan_duration_days?: number
}

export interface UpdateItemTypeInput {
  name?: string
  description?: string
  category?: string
  is_consumable?: boolean
  default_loan_duration_days?: number
}

export interface CreateToolInstanceInput {
  item_type_id: number
  qr_code: string
  serial_number?: string
  status?: ToolInstance['status']
  condition_notes?: string
}

export interface UpdateToolInstanceInput {
  item_type_id?: number
  qr_code?: string
  serial_number?: string
  status?: ToolInstance['status']
  condition_notes?: string
}

export interface CreateLoanInput {
  user_id: number
  tool_instance_id: number
  due_date: string
  notes?: string
}

export interface UpdateLoanInput {
  return_date?: string
  status?: Loan['status']
  notes?: string
}

export interface CreateConsumableRequestInput {
  user_id: number
  item_type_id: number
  requested_quantity: number
  notes?: string
}

export interface UpdateConsumableRequestInput {
  fulfilled_quantity?: number
  status?: ConsumableRequest['status']
  fulfilled_date?: string
  notes?: string
}

export interface CreateNotificationInput {
  user_id: number
  type: string
  title: string
  message: string
}

export interface UpdateNotificationInput {
  is_read?: boolean
  delivery_status?: Notification['delivery_status']
  read_at?: string
  delivered_at?: string
}

export interface CreateAuditLogInput {
  user_id?: number
  action: string
  entity_type: string
  entity_id: number
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string
  user_agent?: string
}

// Stock Movement Input types
export interface CreateStockMovementInput {
  consumable_stock_id: number
  movement_type: StockMovement['movement_type']
  quantity: number
  user_id?: number
  notes?: string
  // Cable marker fields (optional, for cable-type consumables)
  start_marker?: number
  end_marker?: number
}

export interface UpdateStockMovementInput {
  quantity?: number
  notes?: string
  start_marker?: number
  end_marker?: number
}

// Consumable Return Input types
export interface CreateConsumableReturnInput {
  user_id: number
  item_type_id: number
  consumable_stock_id: number
  returned_quantity: number
  original_consumption_date: string
  notes?: string
  // Cable segment fields (optional, for cable-type consumables)
  segment_start?: number
  segment_end?: number
}

export interface UpdateConsumableReturnInput {
  returned_quantity?: number
  notes?: string
  status?: ConsumableReturn['status']
  segment_start?: number
  segment_end?: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    timestamp: string
  }
}

// Query filter types
export interface LoanFilters {
  user_id?: number
  tool_instance_id?: number
  status?: Loan['status']
  overdue?: boolean
  start_date?: string
  end_date?: string
}

export interface ToolFilters {
  status?: ToolInstance['status']
  category?: string
  item_type_id?: number
}

export interface AuditLogFilters {
  user_id?: number
  entity_type?: string
  entity_id?: number
  action?: string
  start_date?: string
  end_date?: string
}

// Consumable Reservation types
export interface ConsumableReservation {
  id: number
  user_id: number
  item_type_id: number
  reserved_quantity: number
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
  reservation_date: string
  expiration_date: string
  pickup_date: string | null
  notes: string | null
  purpose: string | null
  warehouse_qr_code_id: number | null
  required_qr_code_id: number | null  // NEW: The specific QR code that was required
  created_at: string
  updated_at: string
}

export interface ReservationDetails extends ConsumableReservation {
  username: string
  email: string
  item_name: string
  item_category: string | null
  warehouse_qr_code: string | null
  warehouse_location: string | null
  warehouse_zone: string | null
  required_qr_code: string | null  // NEW: The required QR code text
  required_location: string | null  // NEW: The required QR location name
  required_zone: string | null  // NEW: The required QR zone
  unit_of_measure: string | null
  days_until_expiration: number
  is_expired: boolean
  qr_codes_matched: boolean | null  // NEW: Whether scanned and required QR matched
}

export interface CreateReservationInput {
  item_type_id: number
  reserved_quantity: number
  expiration_date: string
  notes?: string
  purpose?: string
}

export interface UpdateReservationInput {
  status?: ConsumableReservation['status']
  pickup_date?: string
  notes?: string
  warehouse_qr_code_id?: number
  required_qr_code_id?: number  // NEW: For updating the required QR code
}

export interface ReservationFilters {
  user_id?: number
  item_type_id?: number
  status?: ConsumableReservation['status']
  expiring_soon?: boolean
}

// QR Scan Attempt types (NEW)
export interface QRScanAttempt {
  id: number
  reservation_id: number
  user_id: number
  required_qr_code_id: number
  scanned_qr_code_id: number | null
  scanned_qr_code_text: string | null
  is_successful: boolean
  attempt_date: string
  ip_address: string | null
  user_agent: string | null
  error_message: string | null
  created_at: string
}

export interface CreateQRScanAttemptInput {
  reservation_id: number
  user_id: number
  required_qr_code_id: number
  scanned_qr_code_id?: number
  scanned_qr_code_text?: string
  is_successful: boolean
  error_message?: string
  ip_address?: string
  user_agent?: string
}

// QR Scan Statistics types (NEW)
export interface QRScanStatistics {
  qr_code_id: number
  qr_code: string
  location_name: string
  zone: string
  is_active: boolean
  times_required: number
  successful_scans: number
  failed_scans: number
  total_attempts: number
  success_rate_percentage: number
  last_scan_attempt: string | null
  avg_attempts_per_reservation: number
}

// Required QR Info types (NEW)
export interface RequiredQRInfo {
  required_qr_code_id: number
  qr_code: string
  location_name: string
  location_description: string
  zone: string
  icon: string
}

export interface RequiredQRResponse {
  success: boolean
  data: RequiredQRInfo
}

// Cable Marker types for API requests/responses
export interface ConsumeWithMarkersRequest {
  qr_code: string
  start_marker: number
  end_marker: number
  notes?: string
}

export interface ReturnWithMarkersRequest {
  returns: Array<{
    item_type_id: number
    consumption_date: string
    segment_start: number
    segment_end: number
    notes?: string
  }>
}

export interface CableSegment {
  segment_start: number
  segment_end: number
  return_date: string
  returned_quantity: number
}

export interface ConsumptionItemWithMarkers {
  item_type_id: number
  consumable_stock_id: number
  item_name: string
  item_description?: string
  consumed_quantity: number
  returned_quantity: number
  returnable_quantity: number
  unit_of_measure: string
  // Cable marker fields
  start_marker: number | null
  end_marker: number | null
  returned_segments: CableSegment[]
}

export interface ConsumptionHistoryWithMarkers {
  consumption_date: string
  items: ConsumptionItemWithMarkers[]
  total_items: number
  total_consumed: number
  total_returnable: number
}

export interface MyConsumptionsWithMarkersResponse {
  data: ConsumptionHistoryWithMarkers[]
  total_dates: number
}

// Cable validation types
export interface MarkerValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SegmentOverlapResult {
  isValid: boolean
  overlappingSegments: CableSegment[]
}

// Device Category types (Dynamic Categories)
export interface DeviceCategory {
  id: number
  name: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
  version: number
}

export interface DeviceCategoryWithCount extends DeviceCategory {
  device_count: number
}

export interface CreateDeviceCategoryInput {
  name: string
  description?: string
  icon?: string
}

export interface UpdateDeviceCategoryInput {
  name?: string
  description?: string
  icon?: string
  is_active?: boolean
}

// Category Field types
export interface CategoryField {
  id: number
  category_id: number
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'boolean'
  is_required: boolean
  is_custom: boolean
  display_order: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateCategoryFieldInput {
  category_id: number
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'boolean'
  is_required?: boolean
  is_custom?: boolean
  display_order?: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
}

export interface UpdateCategoryFieldInput {
  field_name?: string
  field_type?: 'text' | 'number' | 'select' | 'boolean'
  is_required?: boolean
  display_order?: number
  options?: Record<string, unknown>
  validation_rules?: Record<string, unknown>
}

// Device Custom Field types
export interface DeviceCustomField {
  id: number
  electronic_device_id: number
  field_id: number
  field_value: unknown
  created_at: string
  updated_at: string
}

export interface DeviceCustomFieldWithDetails extends DeviceCustomField {
  field: CategoryField
}

export interface CreateDeviceCustomFieldInput {
  electronic_device_id: number
  field_id: number
  field_value: unknown
}

export interface UpdateDeviceCustomFieldInput {
  field_value: unknown
}

// Category Migration types
export interface MigrationAnalysis {
  compatibleFields: string[]
  incompatibleFields: string[]
  devicesToMigrate: number
}

export interface MigrationRequest {
  sourceCategoryId: number
  targetCategoryId: number
  deviceIds?: number[]
  fieldMapping?: Record<string, unknown>
}

export interface MigrationResult {
  success: boolean
  migratedCount: number
  failedCount: number
  errors?: string[]
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Electronic Device types
export type ElectronicCategory = 
  | 'Laptops'
  | 'Tablets'
  | 'Smartphones'
  | 'Periféricos'
  | 'Digitales'
  | 'Otros'

export interface ElectronicDevice {
  id: number
  tool_instance_id: number
  
  // Basic Information
  brand?: string
  model?: string
  // Memory Capacity
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
  
  // Metadata
  created_at: string
  updated_at: string
  version: number
}

export interface ElectronicDeviceWithDetails extends ElectronicDevice {
  tool_instance: ToolInstance
  item_type: ItemType
  current_loan?: Loan
}

export interface CreateElectronicDeviceInput {
  // Basic Info
  name: string
  category: ElectronicCategory
  description?: string
  brand?: string
  model?: string
  serial_number?: string
  // Memory Capacity
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
  
  // Status
  status?: ToolInstance['status']
  condition_notes?: string
}

export interface UpdateElectronicDeviceInput {
  // Basic Info
  name?: string
  category?: ElectronicCategory
  description?: string
  brand?: string
  model?: string
  serial_number?: string
  // Memory Capacity
  memory_capacity?: number
  memory_unit?: 'GB' | 'TB'
  
  // Status
  status?: ToolInstance['status']
  condition_notes?: string
}
