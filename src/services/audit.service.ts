/**
 * AuditService - Dynamic Permissions System
 * 
 * This service handles all audit-related operations including:
 * - Logging permission changes (role created, role updated, role deleted, 
 *   role permissions changed, user permissions changed)
 * - Retrieving audit history with filters (action type, target type, admin user, date range)
 * - Ordering by date descending (most recent first)
 * 
 * Audit records are immutable - no update or delete operations are provided.
 * 
 * @see Requirements 6.1, 6.2, 6.3, 6.4
 * @see Design Document - AuditService Interface
 */

import { supabase } from '@/lib/supabase';
import type { 
  PermissionAuditEntry, 
  AuditHistoryFilters 
} from '@/types/permissions';

/**
 * Input type for logging a permission change
 */
export interface LogPermissionChangeInput {
  adminUserId: number;
  actionType: PermissionAuditEntry['actionType'];
  targetType: 'role' | 'user';
  targetId: number;
  targetName: string;
  changes: {
    added?: string[];
    removed?: string[];
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Paginated result for audit history
 */
export interface AuditHistoryResult {
  entries: PermissionAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Options for audit history query
 */
export interface AuditHistoryOptions {
  filters?: AuditHistoryFilters;
  page?: number;
  pageSize?: number;
}

/**
 * Default page size for audit history queries
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size allowed
 */
const MAX_PAGE_SIZE = 100;

/**
 * Log a permission change to the audit table
 * 
 * This function records all permission-related changes including:
 * - Role creation, update, and deletion
 * - Role permission changes
 * - User permission changes (overrides)
 * 
 * @param input - The audit log entry details
 * @returns The created audit entry
 * @see Requirements 6.1 - Log role permission changes
 * @see Requirements 6.2 - Log user permission changes
 * @see Requirements 6.3 - Log role creation/deletion
 */
export async function logPermissionChange(
  input: LogPermissionChangeInput
): Promise<PermissionAuditEntry> {
  const { data, error } = await supabase
    .from('permissions_audit')
    .insert({
      admin_user_id: input.adminUserId,
      action_type: input.actionType,
      target_type: input.targetType,
      target_id: input.targetId,
      target_name: input.targetName,
      changes: input.changes,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    })
    .select(`
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      target_name,
      changes,
      ip_address,
      user_agent,
      created_at
    `)
    .single();

  if (error) {
    throw new Error(`Failed to log permission change: ${error.message}`);
  }

  // Get admin username if available
  let adminUsername: string | undefined;
  if (data.admin_user_id) {
    const { data: adminUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', data.admin_user_id)
      .single();
    
    if (adminUser) {
      adminUsername = adminUser.username;
    }
  }

  return mapToAuditEntry(data, adminUsername);
}

/**
 * Get audit history with optional filters and pagination
 * 
 * Results are always ordered by created_at DESC (most recent first)
 * 
 * @param options - Query options including filters, page, and pageSize
 * @returns Paginated audit history result
 * @see Requirements 6.4 - Show audit history ordered by date descending with filters
 */
export async function getAuditHistory(
  options: AuditHistoryOptions = {}
): Promise<AuditHistoryResult> {
  const { 
    filters = {}, 
    page = 1, 
    pageSize = DEFAULT_PAGE_SIZE 
  } = options;

  // Validate and constrain page size
  const constrainedPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const constrainedPage = Math.max(1, page);
  const offset = (constrainedPage - 1) * constrainedPageSize;

  // Build the query
  let query = supabase
    .from('permissions_audit')
    .select(`
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      target_name,
      changes,
      ip_address,
      user_agent,
      created_at
    `, { count: 'exact' });

  // Apply filters
  if (filters.actionType) {
    query = query.eq('action_type', filters.actionType);
  }

  if (filters.targetType) {
    query = query.eq('target_type', filters.targetType);
  }

  if (filters.adminUserId) {
    query = query.eq('admin_user_id', filters.adminUserId);
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }

  // Always order by created_at DESC (most recent first)
  // @see Requirements 6.4
  query = query.order('created_at', { ascending: false });

  // Apply pagination
  query = query.range(offset, offset + constrainedPageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get audit history: ${error.message}`);
  }

  // Get admin usernames for all entries
  const adminUserIds = [...new Set(
    (data || [])
      .filter(entry => entry.admin_user_id !== null)
      .map(entry => entry.admin_user_id)
  )];

  const adminUsernames: Record<number, string> = {};
  
  if (adminUserIds.length > 0) {
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, username')
      .in('id', adminUserIds);

    if (adminUsers) {
      for (const user of adminUsers) {
        adminUsernames[user.id] = user.username;
      }
    }
  }

  // Map to audit entries
  const entries = (data || []).map(row => 
    mapToAuditEntry(row, row.admin_user_id ? adminUsernames[row.admin_user_id] : undefined)
  );

  const total = count || 0;
  const totalPages = Math.ceil(total / constrainedPageSize);

  return {
    entries,
    total,
    page: constrainedPage,
    pageSize: constrainedPageSize,
    totalPages,
  };
}

/**
 * Get a single audit entry by ID
 * 
 * @param id - The audit entry ID
 * @returns The audit entry or null if not found
 */
export async function getAuditEntryById(id: number): Promise<PermissionAuditEntry | null> {
  const { data, error } = await supabase
    .from('permissions_audit')
    .select(`
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      target_name,
      changes,
      ip_address,
      user_agent,
      created_at
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get audit entry: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Get admin username if available
  let adminUsername: string | undefined;
  if (data.admin_user_id) {
    const { data: adminUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', data.admin_user_id)
      .single();
    
    if (adminUser) {
      adminUsername = adminUser.username;
    }
  }

  return mapToAuditEntry(data, adminUsername);
}

/**
 * Get audit entries for a specific target (role or user)
 * 
 * @param targetType - The type of target ('role' or 'user')
 * @param targetId - The ID of the target
 * @param limit - Maximum number of entries to return (default 50)
 * @returns Array of audit entries for the target
 */
export async function getAuditEntriesForTarget(
  targetType: 'role' | 'user',
  targetId: number,
  limit: number = 50
): Promise<PermissionAuditEntry[]> {
  const constrainedLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

  const { data, error } = await supabase
    .from('permissions_audit')
    .select(`
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      target_name,
      changes,
      ip_address,
      user_agent,
      created_at
    `)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(constrainedLimit);

  if (error) {
    throw new Error(`Failed to get audit entries for target: ${error.message}`);
  }

  // Get admin usernames for all entries
  const adminUserIds = [...new Set(
    (data || [])
      .filter(entry => entry.admin_user_id !== null)
      .map(entry => entry.admin_user_id)
  )];

  const adminUsernames: Record<number, string> = {};
  
  if (adminUserIds.length > 0) {
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, username')
      .in('id', adminUserIds);

    if (adminUsers) {
      for (const user of adminUsers) {
        adminUsernames[user.id] = user.username;
      }
    }
  }

  return (data || []).map(row => 
    mapToAuditEntry(row, row.admin_user_id ? adminUsernames[row.admin_user_id] : undefined)
  );
}

/**
 * Get audit entries by admin user
 * 
 * @param adminUserId - The admin user ID
 * @param limit - Maximum number of entries to return (default 50)
 * @returns Array of audit entries made by the admin
 */
export async function getAuditEntriesByAdmin(
  adminUserId: number,
  limit: number = 50
): Promise<PermissionAuditEntry[]> {
  const constrainedLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

  const { data, error } = await supabase
    .from('permissions_audit')
    .select(`
      id,
      admin_user_id,
      action_type,
      target_type,
      target_id,
      target_name,
      changes,
      ip_address,
      user_agent,
      created_at
    `)
    .eq('admin_user_id', adminUserId)
    .order('created_at', { ascending: false })
    .limit(constrainedLimit);

  if (error) {
    throw new Error(`Failed to get audit entries by admin: ${error.message}`);
  }

  // Get admin username
  let adminUsername: string | undefined;
  const { data: adminUser } = await supabase
    .from('users')
    .select('username')
    .eq('id', adminUserId)
    .single();
  
  if (adminUser) {
    adminUsername = adminUser.username;
  }

  return (data || []).map(row => mapToAuditEntry(row, adminUsername));
}

/**
 * Map a database row to a PermissionAuditEntry
 * 
 * @param row - The database row
 * @param adminUsername - Optional admin username
 * @returns PermissionAuditEntry object
 */
function mapToAuditEntry(
  row: {
    id: number;
    admin_user_id: number | null;
    action_type: string;
    target_type: string;
    target_id: number;
    target_name: string;
    changes: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
  },
  adminUsername?: string
): PermissionAuditEntry {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    adminUsername,
    actionType: row.action_type as PermissionAuditEntry['actionType'],
    targetType: row.target_type as 'role' | 'user',
    targetId: row.target_id,
    targetName: row.target_name,
    changes: row.changes as PermissionAuditEntry['changes'],
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  };
}

// Export the AuditService as a namespace for cleaner imports
export const AuditService = {
  logPermissionChange,
  getAuditHistory,
  getAuditEntryById,
  getAuditEntriesForTarget,
  getAuditEntriesByAdmin,
};

export default AuditService;
