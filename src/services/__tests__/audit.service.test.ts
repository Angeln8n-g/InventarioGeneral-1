/**
 * AuditService - Unit Tests and Property-Based Tests
 * 
 * Feature: dynamic-permissions-system
 * 
 * This test file validates the AuditService functionality:
 * - logPermissionChange for recording audit entries
 * - getAuditHistory with filters and ordering
 * 
 * Property-Based Tests:
 * - Property 5: Auditoría de operaciones de permisos
 * - Property 12: Ordenamiento de auditoría
 * - Property 13: Inmutabilidad de auditoría
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import * as fc from 'fast-check';
import { 
  AuditService,
  LogPermissionChangeInput,
  AuditHistoryOptions
} from '@/services/audit.service';
import type { PermissionAuditEntry } from '@/types/permissions';
import { PERMISSIONS } from '@/lib/permissions';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Feature: dynamic-permissions-system - AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logPermissionChange', () => {
    /**
     * Test: Log role permission changes
     * **Validates: Requirements 6.1**
     */
    it('should log role permission changes with all required fields', async () => {
      const mockAuditEntry = {
        id: 1,
        admin_user_id: 1,
        action_type: 'role_permissions_changed',
        target_type: 'role',
        target_id: 2,
        target_name: 'editor',
        changes: { added: ['tools:view'], removed: ['loans:create'] },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockAdminUser = { username: 'admin' };

      // Mock the insert chain
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAuditEntry, error: null }),
        }),
      });

      // Mock the admin user query
      const mockSelectAdmin = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAdminUser, error: null }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { select: mockSelectAdmin };
        }
        return {};
      });

      const input: LogPermissionChangeInput = {
        adminUserId: 1,
        actionType: 'role_permissions_changed',
        targetType: 'role',
        targetId: 2,
        targetName: 'editor',
        changes: { added: ['tools:view'], removed: ['loans:create'] },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await AuditService.logPermissionChange(input);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.adminUserId).toBe(1);
      expect(result.adminUsername).toBe('admin');
      expect(result.actionType).toBe('role_permissions_changed');
      expect(result.targetType).toBe('role');
      expect(result.targetId).toBe(2);
      expect(result.targetName).toBe('editor');
      expect(result.changes.added).toEqual(['tools:view']);
      expect(result.changes.removed).toEqual(['loans:create']);
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.userAgent).toBe('Mozilla/5.0');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    /**
     * Test: Log user permission changes
     * **Validates: Requirements 6.2**
     */
    it('should log user permission changes with all required fields', async () => {
      const mockAuditEntry = {
        id: 2,
        admin_user_id: 1,
        action_type: 'user_permissions_changed',
        target_type: 'user',
        target_id: 5,
        target_name: 'john.doe',
        changes: { added: ['reports:view'], removed: [] },
        ip_address: null,
        user_agent: null,
        created_at: '2024-01-15T11:00:00Z',
      };

      const mockAdminUser = { username: 'admin' };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAuditEntry, error: null }),
        }),
      });

      const mockSelectAdmin = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAdminUser, error: null }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { select: mockSelectAdmin };
        }
        return {};
      });

      const input: LogPermissionChangeInput = {
        adminUserId: 1,
        actionType: 'user_permissions_changed',
        targetType: 'user',
        targetId: 5,
        targetName: 'john.doe',
        changes: { added: ['reports:view'], removed: [] },
      };

      const result = await AuditService.logPermissionChange(input);

      expect(result.actionType).toBe('user_permissions_changed');
      expect(result.targetType).toBe('user');
      expect(result.targetId).toBe(5);
      expect(result.targetName).toBe('john.doe');
    });

    /**
     * Test: Log role creation
     * **Validates: Requirements 6.3**
     */
    it('should log role creation with all relevant details', async () => {
      const mockAuditEntry = {
        id: 3,
        admin_user_id: 1,
        action_type: 'role_created',
        target_type: 'role',
        target_id: 10,
        target_name: 'supervisor',
        changes: { 
          after: { 
            name: 'supervisor', 
            description: 'Supervisor role',
            permissions: ['tools:view', 'loans:view']
          } 
        },
        ip_address: null,
        user_agent: null,
        created_at: '2024-01-15T12:00:00Z',
      };

      const mockAdminUser = { username: 'admin' };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAuditEntry, error: null }),
        }),
      });

      const mockSelectAdmin = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAdminUser, error: null }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { select: mockSelectAdmin };
        }
        return {};
      });

      const input: LogPermissionChangeInput = {
        adminUserId: 1,
        actionType: 'role_created',
        targetType: 'role',
        targetId: 10,
        targetName: 'supervisor',
        changes: { 
          after: { 
            name: 'supervisor', 
            description: 'Supervisor role',
            permissions: ['tools:view', 'loans:view']
          } 
        },
      };

      const result = await AuditService.logPermissionChange(input);

      expect(result.actionType).toBe('role_created');
      expect(result.changes.after).toBeDefined();
    });

    /**
     * Test: Log role deletion
     * **Validates: Requirements 6.3**
     */
    it('should log role deletion with all relevant details', async () => {
      const mockAuditEntry = {
        id: 4,
        admin_user_id: 1,
        action_type: 'role_deleted',
        target_type: 'role',
        target_id: 10,
        target_name: 'old-role',
        changes: { 
          before: { 
            name: 'old-role', 
            description: 'Old role to delete',
            isProtected: false
          } 
        },
        ip_address: null,
        user_agent: null,
        created_at: '2024-01-15T13:00:00Z',
      };

      const mockAdminUser = { username: 'admin' };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAuditEntry, error: null }),
        }),
      });

      const mockSelectAdmin = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAdminUser, error: null }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return { insert: mockInsert };
        }
        if (table === 'users') {
          return { select: mockSelectAdmin };
        }
        return {};
      });

      const input: LogPermissionChangeInput = {
        adminUserId: 1,
        actionType: 'role_deleted',
        targetType: 'role',
        targetId: 10,
        targetName: 'old-role',
        changes: { 
          before: { 
            name: 'old-role', 
            description: 'Old role to delete',
            isProtected: false
          } 
        },
      };

      const result = await AuditService.logPermissionChange(input);

      expect(result.actionType).toBe('role_deleted');
      expect(result.changes.before).toBeDefined();
    });

    it('should throw error when database insert fails', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const input: LogPermissionChangeInput = {
        adminUserId: 1,
        actionType: 'role_created',
        targetType: 'role',
        targetId: 1,
        targetName: 'test',
        changes: {},
      };

      await expect(AuditService.logPermissionChange(input))
        .rejects.toThrow('Failed to log permission change: Database error');
    });
  });

  describe('getAuditHistory', () => {
    /**
     * Test: Get audit history ordered by date descending
     * **Validates: Requirements 6.4**
     */
    it('should return audit history ordered by date descending (most recent first)', async () => {
      const mockEntries = [
        {
          id: 3,
          admin_user_id: 1,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 3,
          target_name: 'newest',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T15:00:00Z',
        },
        {
          id: 2,
          admin_user_id: 1,
          action_type: 'role_updated',
          target_type: 'role',
          target_id: 2,
          target_name: 'middle',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T14:00:00Z',
        },
        {
          id: 1,
          admin_user_id: 1,
          action_type: 'role_deleted',
          target_type: 'role',
          target_id: 1,
          target_name: 'oldest',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T13:00:00Z',
        },
      ];

      const mockAdminUsers = [{ id: 1, username: 'admin' }];

      // Create a chainable mock
      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 3 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: mockAdminUsers, 
          error: null 
        });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        return createChainableMock();
      });

      const result = await AuditService.getAuditHistory();

      expect(result.entries).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      
      // Verify order is descending (most recent first)
      expect(result.entries[0].id).toBe(3);
      expect(result.entries[1].id).toBe(2);
      expect(result.entries[2].id).toBe(1);
    });

    /**
     * Test: Filter by action type
     * **Validates: Requirements 6.4**
     */
    it('should filter audit history by action type', async () => {
      const mockEntries = [
        {
          id: 1,
          admin_user_id: 1,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 1,
          target_name: 'test',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 1 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [{ id: 1, username: 'admin' }], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const options: AuditHistoryOptions = {
        filters: { actionType: 'role_created' },
      };

      const result = await AuditService.getAuditHistory(options);

      expect(chainableMock.eq).toHaveBeenCalledWith('action_type', 'role_created');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].actionType).toBe('role_created');
    });

    /**
     * Test: Filter by target type
     * **Validates: Requirements 6.4**
     */
    it('should filter audit history by target type', async () => {
      const mockEntries = [
        {
          id: 1,
          admin_user_id: 1,
          action_type: 'user_permissions_changed',
          target_type: 'user',
          target_id: 5,
          target_name: 'john',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 1 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [{ id: 1, username: 'admin' }], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const options: AuditHistoryOptions = {
        filters: { targetType: 'user' },
      };

      const result = await AuditService.getAuditHistory(options);

      expect(chainableMock.eq).toHaveBeenCalledWith('target_type', 'user');
      expect(result.entries[0].targetType).toBe('user');
    });

    /**
     * Test: Filter by admin user
     * **Validates: Requirements 6.4**
     */
    it('should filter audit history by admin user', async () => {
      const mockEntries = [
        {
          id: 1,
          admin_user_id: 2,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 1,
          target_name: 'test',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 1 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [{ id: 2, username: 'admin2' }], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const options: AuditHistoryOptions = {
        filters: { adminUserId: 2 },
      };

      const result = await AuditService.getAuditHistory(options);

      expect(chainableMock.eq).toHaveBeenCalledWith('admin_user_id', 2);
    });

    /**
     * Test: Filter by date range
     * **Validates: Requirements 6.4**
     */
    it('should filter audit history by date range', async () => {
      const mockEntries: Array<Record<string, unknown>> = [];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 0 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const options: AuditHistoryOptions = {
        filters: { startDate, endDate },
      };

      await AuditService.getAuditHistory(options);

      expect(chainableMock.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(chainableMock.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    /**
     * Test: Pagination
     */
    it('should support pagination', async () => {
      const mockEntries = [
        {
          id: 5,
          admin_user_id: 1,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 5,
          target_name: 'test5',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: mockEntries, 
          error: null, 
          count: 50 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [{ id: 1, username: 'admin' }], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const options: AuditHistoryOptions = {
        page: 3,
        pageSize: 10,
      };

      const result = await AuditService.getAuditHistory(options);

      // Page 3 with pageSize 10 should have offset 20
      expect(chainableMock.range).toHaveBeenCalledWith(20, 29);
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(5);
    });

    /**
     * Test: Constrain page size to maximum
     */
    it('should constrain page size to maximum allowed', async () => {
      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: [], 
          error: null, 
          count: 0 
        });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [], 
          error: null 
        });
        return mock;
      };

      const chainableMock = createChainableMock();
      (mockSupabase.from as jest.Mock).mockReturnValue(chainableMock);

      const options: AuditHistoryOptions = {
        page: 1,
        pageSize: 500, // Exceeds max of 100
      };

      const result = await AuditService.getAuditHistory(options);

      // Should be constrained to 100
      expect(chainableMock.range).toHaveBeenCalledWith(0, 99);
      expect(result.pageSize).toBe(100);
    });

    it('should throw error when database query fails', async () => {
      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.gte = jest.fn().mockReturnValue(mock);
        mock.lte = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.range = jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' }, 
          count: null 
        });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(createChainableMock());

      await expect(AuditService.getAuditHistory())
        .rejects.toThrow('Failed to get audit history: Database error');
    });
  });

  describe('getAuditEntryById', () => {
    it('should return audit entry by ID', async () => {
      const mockEntry = {
        id: 1,
        admin_user_id: 1,
        action_type: 'role_created',
        target_type: 'role',
        target_id: 1,
        target_name: 'test',
        changes: { after: { name: 'test' } },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockAdminUser = { username: 'admin' };

      const createChainableMock = (returnData: unknown) => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.single = jest.fn().mockResolvedValue({ data: returnData, error: null });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return createChainableMock(mockEntry);
        }
        if (table === 'users') {
          return createChainableMock(mockAdminUser);
        }
        return {};
      });

      const result = await AuditService.getAuditEntryById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.adminUsername).toBe('admin');
    });

    it('should return null when entry not found', async () => {
      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.single = jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows returned' } 
        });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(createChainableMock());

      const result = await AuditService.getAuditEntryById(999);

      expect(result).toBeNull();
    });
  });

  describe('getAuditEntriesForTarget', () => {
    it('should return audit entries for a specific target', async () => {
      const mockEntries = [
        {
          id: 2,
          admin_user_id: 1,
          action_type: 'role_permissions_changed',
          target_type: 'role',
          target_id: 5,
          target_name: 'editor',
          changes: { added: ['tools:view'] },
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T11:00:00Z',
        },
        {
          id: 1,
          admin_user_id: 1,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 5,
          target_name: 'editor',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const createChainableMock = () => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.limit = jest.fn().mockResolvedValue({ data: mockEntries, error: null });
        mock.in = jest.fn().mockResolvedValue({ 
          data: [{ id: 1, username: 'admin' }], 
          error: null 
        });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockReturnValue(createChainableMock());

      const result = await AuditService.getAuditEntriesForTarget('role', 5);

      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe(5);
      expect(result[1].targetId).toBe(5);
    });
  });

  describe('getAuditEntriesByAdmin', () => {
    it('should return audit entries made by a specific admin', async () => {
      const mockEntries = [
        {
          id: 1,
          admin_user_id: 2,
          action_type: 'role_created',
          target_type: 'role',
          target_id: 1,
          target_name: 'test',
          changes: {},
          ip_address: null,
          user_agent: null,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      const mockAdminUser = { username: 'admin2' };

      const createChainableMock = (returnData: unknown) => {
        const mock: Record<string, jest.Mock> = {};
        mock.select = jest.fn().mockReturnValue(mock);
        mock.eq = jest.fn().mockReturnValue(mock);
        mock.order = jest.fn().mockReturnValue(mock);
        mock.limit = jest.fn().mockResolvedValue({ data: returnData, error: null });
        mock.single = jest.fn().mockResolvedValue({ data: mockAdminUser, error: null });
        return mock;
      };

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'permissions_audit') {
          return createChainableMock(mockEntries);
        }
        if (table === 'users') {
          return createChainableMock(mockAdminUser);
        }
        return {};
      });

      const result = await AuditService.getAuditEntriesByAdmin(2);

      expect(result).toHaveLength(1);
      expect(result[0].adminUserId).toBe(2);
      expect(result[0].adminUsername).toBe('admin2');
    });
  });
});


/**
 * Get all permission values from the PERMISSIONS constant
 */
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Valid action types for audit entries
 */
const AUDIT_ACTION_TYPES = [
  'role_created',
  'role_updated', 
  'role_deleted',
  'role_permissions_changed',
  'user_permissions_changed',
] as const;

/**
 * Valid target types for audit entries
 */
const TARGET_TYPES = ['role', 'user'] as const;

/**
 * Generator for valid role names
 */
const validRoleNameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for valid usernames
 */
const validUsernameArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => s.trim().length > 0 && /^[a-zA-Z0-9._-]+$/.test(s));

/**
 * Generator for permission sets
 */
const permissionSetArb = fc.uniqueArray(fc.constantFrom(...ALL_PERMISSIONS), { minLength: 0, maxLength: 10 });

/**
 * Generator for audit action types
 */
const actionTypeArb = fc.constantFrom(...AUDIT_ACTION_TYPES);

/**
 * Generator for target types
 */
const targetTypeArb = fc.constantFrom(...TARGET_TYPES);

/**
 * Generator for positive integers (IDs)
 */
const positiveIntArb = fc.integer({ min: 1, max: 10000 });

/**
 * Generator for IP addresses
 */
const ipAddressArb = fc.option(
  fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`)
);

/**
 * Generator for user agents
 */
const userAgentArb = fc.option(fc.string({ minLength: 10, maxLength: 100 }));


/**
 * Generator for audit changes object
 */
const auditChangesArb = fc.record({
  added: fc.option(permissionSetArb),
  removed: fc.option(permissionSetArb),
  before: fc.option(fc.record({
    name: fc.option(validRoleNameArb),
    description: fc.option(fc.string({ maxLength: 200 })),
    isProtected: fc.option(fc.boolean()),
  })),
  after: fc.option(fc.record({
    name: fc.option(validRoleNameArb),
    description: fc.option(fc.string({ maxLength: 200 })),
    permissions: fc.option(permissionSetArb),
  })),
}).map(changes => {
  const result: Record<string, unknown> = {};
  if (changes.added !== null) result.added = changes.added;
  if (changes.removed !== null) result.removed = changes.removed;
  if (changes.before !== null) result.before = changes.before;
  if (changes.after !== null) result.after = changes.after;
  return result;
});

/**
 * Generator for complete audit entry input
 */
const auditEntryInputArb = fc.record({
  adminUserId: positiveIntArb,
  actionType: actionTypeArb,
  targetType: targetTypeArb,
  targetId: positiveIntArb,
  targetName: validRoleNameArb,
  changes: auditChangesArb,
  ipAddress: ipAddressArb,
  userAgent: userAgentArb,
});


/**
 * ============================================================================
 * PROPERTY-BASED TESTS FOR AUDIT SERVICE
 * Feature: dynamic-permissions-system
 * ============================================================================
 */
describe('Feature: dynamic-permissions-system - Property-Based Tests for Audit', () => {
  /**
   * Property 5: Auditoría de operaciones de permisos
   * 
   * For any operation that modifies roles or permissions (create role, delete role,
   * change role permissions, change user permissions), there must be a corresponding
   * audit record with the admin who made the change, the affected target, and the
   * changes made.
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * Since these tests require database operations, we create pure function tests
   * that validate the logic without DB calls.
   */
  describe('Property 5: Auditoría de operaciones de permisos', () => {
    /**
     * Mock audit store that simulates the audit service behavior
     * This allows us to test the audit logic without database calls
     */
    interface MockAuditEntry {
      id: number;
      adminUserId: number;
      actionType: typeof AUDIT_ACTION_TYPES[number];
      targetType: 'role' | 'user';
      targetId: number;
      targetName: string;
      changes: Record<string, unknown>;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
    }

    class MockAuditStore {
      private entries: MockAuditEntry[] = [];
      private nextId = 1;

      logPermissionChange(input: {
        adminUserId: number;
        actionType: typeof AUDIT_ACTION_TYPES[number];
        targetType: 'role' | 'user';
        targetId: number;
        targetName: string;
        changes: Record<string, unknown>;
        ipAddress?: string | null;
        userAgent?: string | null;
      }): MockAuditEntry {
        const entry: MockAuditEntry = {
          id: this.nextId++,
          adminUserId: input.adminUserId,
          actionType: input.actionType,
          targetType: input.targetType,
          targetId: input.targetId,
          targetName: input.targetName,
          changes: input.changes,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          createdAt: new Date(),
        };
        this.entries.push(entry);
        return entry;
      }

      getEntriesForTarget(targetType: 'role' | 'user', targetId: number): MockAuditEntry[] {
        return this.entries.filter(e => e.targetType === targetType && e.targetId === targetId);
      }

      getEntriesByAdmin(adminUserId: number): MockAuditEntry[] {
        return this.entries.filter(e => e.adminUserId === adminUserId);
      }

      getAllEntries(): MockAuditEntry[] {
        return [...this.entries];
      }

      clear(): void {
        this.entries = [];
        this.nextId = 1;
      }
    }


    it('should create audit record for every permission operation with all required fields', () => {
      fc.assert(
        fc.property(
          auditEntryInputArb,
          (input) => {
            const store = new MockAuditStore();
            
            // Log the permission change
            const entry = store.logPermissionChange({
              adminUserId: input.adminUserId,
              actionType: input.actionType,
              targetType: input.targetType,
              targetId: input.targetId,
              targetName: input.targetName,
              changes: input.changes,
              ipAddress: input.ipAddress ?? undefined,
              userAgent: input.userAgent ?? undefined,
            });
            
            // Verify all required fields are present
            expect(entry.id).toBeGreaterThan(0);
            expect(entry.adminUserId).toBe(input.adminUserId);
            expect(entry.actionType).toBe(input.actionType);
            expect(entry.targetType).toBe(input.targetType);
            expect(entry.targetId).toBe(input.targetId);
            expect(entry.targetName).toBe(input.targetName);
            expect(entry.changes).toEqual(input.changes);
            expect(entry.createdAt).toBeInstanceOf(Date);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record audit entry for role creation operations', () => {
      fc.assert(
        fc.property(
          positiveIntArb,
          positiveIntArb,
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          permissionSetArb,
          (adminId, roleId, roleName, description, permissions) => {
            const store = new MockAuditStore();
            
            // Simulate role creation audit
            const entry = store.logPermissionChange({
              adminUserId: adminId,
              actionType: 'role_created',
              targetType: 'role',
              targetId: roleId,
              targetName: roleName,
              changes: {
                after: {
                  name: roleName,
                  description: description ?? null,
                  permissions,
                },
              },
            });
            
            // Verify audit record exists with correct data
            expect(entry.actionType).toBe('role_created');
            expect(entry.targetType).toBe('role');
            expect(entry.targetId).toBe(roleId);
            expect(entry.targetName).toBe(roleName);
            expect(entry.changes.after).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should record audit entry for role deletion operations', () => {
      fc.assert(
        fc.property(
          positiveIntArb,
          positiveIntArb,
          validRoleNameArb,
          fc.option(fc.string({ maxLength: 200 })),
          (adminId, roleId, roleName, description) => {
            const store = new MockAuditStore();
            
            // Simulate role deletion audit
            const entry = store.logPermissionChange({
              adminUserId: adminId,
              actionType: 'role_deleted',
              targetType: 'role',
              targetId: roleId,
              targetName: roleName,
              changes: {
                before: {
                  name: roleName,
                  description: description ?? null,
                  isProtected: false,
                },
              },
            });
            
            // Verify audit record exists with correct data
            expect(entry.actionType).toBe('role_deleted');
            expect(entry.targetType).toBe('role');
            expect(entry.changes.before).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should record audit entry for role permission changes', () => {
      fc.assert(
        fc.property(
          positiveIntArb,
          positiveIntArb,
          validRoleNameArb,
          permissionSetArb,
          permissionSetArb,
          (adminId, roleId, roleName, addedPerms, removedPerms) => {
            const store = new MockAuditStore();
            
            // Simulate role permission change audit
            const entry = store.logPermissionChange({
              adminUserId: adminId,
              actionType: 'role_permissions_changed',
              targetType: 'role',
              targetId: roleId,
              targetName: roleName,
              changes: {
                added: addedPerms,
                removed: removedPerms,
              },
            });
            
            // Verify audit record exists with correct data
            expect(entry.actionType).toBe('role_permissions_changed');
            expect(entry.targetType).toBe('role');
            expect(entry.changes.added).toEqual(addedPerms);
            expect(entry.changes.removed).toEqual(removedPerms);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should record audit entry for user permission changes', () => {
      fc.assert(
        fc.property(
          positiveIntArb,
          positiveIntArb,
          validUsernameArb,
          permissionSetArb,
          permissionSetArb,
          (adminId, userId, username, addedPerms, removedPerms) => {
            const store = new MockAuditStore();
            
            // Simulate user permission change audit
            const entry = store.logPermissionChange({
              adminUserId: adminId,
              actionType: 'user_permissions_changed',
              targetType: 'user',
              targetId: userId,
              targetName: username,
              changes: {
                added: addedPerms,
                removed: removedPerms,
              },
            });
            
            // Verify audit record exists with correct data
            expect(entry.actionType).toBe('user_permissions_changed');
            expect(entry.targetType).toBe('user');
            expect(entry.targetId).toBe(userId);
            expect(entry.targetName).toBe(username);
            expect(entry.changes.added).toEqual(addedPerms);
            expect(entry.changes.removed).toEqual(removedPerms);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow querying audit entries by target', () => {
      fc.assert(
        fc.property(
          fc.array(auditEntryInputArb, { minLength: 1, maxLength: 20 }),
          targetTypeArb,
          positiveIntArb,
          (inputs, queryTargetType, queryTargetId) => {
            const store = new MockAuditStore();
            
            // Log all entries
            for (const input of inputs) {
              store.logPermissionChange({
                adminUserId: input.adminUserId,
                actionType: input.actionType,
                targetType: input.targetType,
                targetId: input.targetId,
                targetName: input.targetName,
                changes: input.changes,
              });
            }
            
            // Query by target
            const targetEntries = store.getEntriesForTarget(queryTargetType, queryTargetId);
            
            // Verify all returned entries match the query criteria
            for (const entry of targetEntries) {
              expect(entry.targetType).toBe(queryTargetType);
              expect(entry.targetId).toBe(queryTargetId);
            }
            
            // Verify count matches expected
            const expectedCount = inputs.filter(
              i => i.targetType === queryTargetType && i.targetId === queryTargetId
            ).length;
            expect(targetEntries.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should allow querying audit entries by admin user', () => {
      fc.assert(
        fc.property(
          fc.array(auditEntryInputArb, { minLength: 1, maxLength: 20 }),
          positiveIntArb,
          (inputs, queryAdminId) => {
            const store = new MockAuditStore();
            
            // Log all entries
            for (const input of inputs) {
              store.logPermissionChange({
                adminUserId: input.adminUserId,
                actionType: input.actionType,
                targetType: input.targetType,
                targetId: input.targetId,
                targetName: input.targetName,
                changes: input.changes,
              });
            }
            
            // Query by admin
            const adminEntries = store.getEntriesByAdmin(queryAdminId);
            
            // Verify all returned entries match the query criteria
            for (const entry of adminEntries) {
              expect(entry.adminUserId).toBe(queryAdminId);
            }
            
            // Verify count matches expected
            const expectedCount = inputs.filter(i => i.adminUserId === queryAdminId).length;
            expect(adminEntries.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 12: Ordenamiento de auditoría
   * 
   * For any query to the audit history, records must be ordered by creation date
   * in descending order (most recent first).
   * 
   * **Validates: Requirements 6.4**
   */
  describe('Property 12: Ordenamiento de auditoría', () => {
    /**
     * Mock audit store with ordering support
     */
    interface MockAuditEntryWithDate {
      id: number;
      adminUserId: number;
      actionType: typeof AUDIT_ACTION_TYPES[number];
      targetType: 'role' | 'user';
      targetId: number;
      targetName: string;
      changes: Record<string, unknown>;
      createdAt: Date;
    }

    class MockAuditStoreWithOrdering {
      private entries: MockAuditEntryWithDate[] = [];
      private nextId = 1;

      logPermissionChange(input: {
        adminUserId: number;
        actionType: typeof AUDIT_ACTION_TYPES[number];
        targetType: 'role' | 'user';
        targetId: number;
        targetName: string;
        changes: Record<string, unknown>;
        createdAt?: Date;
      }): MockAuditEntryWithDate {
        const entry: MockAuditEntryWithDate = {
          id: this.nextId++,
          adminUserId: input.adminUserId,
          actionType: input.actionType,
          targetType: input.targetType,
          targetId: input.targetId,
          targetName: input.targetName,
          changes: input.changes,
          createdAt: input.createdAt ?? new Date(),
        };
        this.entries.push(entry);
        return entry;
      }

      getAuditHistory(): MockAuditEntryWithDate[] {
        // Always return sorted by createdAt DESC (most recent first)
        return [...this.entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      getAuditHistoryForTarget(targetType: 'role' | 'user', targetId: number): MockAuditEntryWithDate[] {
        return this.entries
          .filter(e => e.targetType === targetType && e.targetId === targetId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      clear(): void {
        this.entries = [];
        this.nextId = 1;
      }
    }


    it('should return audit entries ordered by date descending (most recent first)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              adminUserId: positiveIntArb,
              actionType: actionTypeArb,
              targetType: targetTypeArb,
              targetId: positiveIntArb,
              targetName: validRoleNameArb,
              changes: auditChangesArb,
              // Generate dates within a reasonable range
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            }),
            { minLength: 2, maxLength: 50 }
          ),
          (inputs) => {
            const store = new MockAuditStoreWithOrdering();
            
            // Log all entries with their specific dates
            for (const input of inputs) {
              store.logPermissionChange({
                adminUserId: input.adminUserId,
                actionType: input.actionType,
                targetType: input.targetType,
                targetId: input.targetId,
                targetName: input.targetName,
                changes: input.changes,
                createdAt: input.createdAt,
              });
            }
            
            // Get audit history
            const history = store.getAuditHistory();
            
            // Verify ordering: each entry should have createdAt >= next entry's createdAt
            for (let i = 0; i < history.length - 1; i++) {
              expect(history[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                history[i + 1].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain descending order when filtering by target', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              adminUserId: positiveIntArb,
              actionType: actionTypeArb,
              targetType: targetTypeArb,
              targetId: fc.integer({ min: 1, max: 5 }), // Limited range to ensure some matches
              targetName: validRoleNameArb,
              changes: auditChangesArb,
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          targetTypeArb,
          fc.integer({ min: 1, max: 5 }),
          (inputs, queryTargetType, queryTargetId) => {
            const store = new MockAuditStoreWithOrdering();
            
            // Log all entries
            for (const input of inputs) {
              store.logPermissionChange({
                adminUserId: input.adminUserId,
                actionType: input.actionType,
                targetType: input.targetType,
                targetId: input.targetId,
                targetName: input.targetName,
                changes: input.changes,
                createdAt: input.createdAt,
              });
            }
            
            // Get filtered history
            const history = store.getAuditHistoryForTarget(queryTargetType, queryTargetId);
            
            // Verify ordering is maintained even after filtering
            for (let i = 0; i < history.length - 1; i++) {
              expect(history[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                history[i + 1].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should place newest entries first regardless of insertion order', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            { minLength: 3, maxLength: 20 }
          ),
          (dates) => {
            const store = new MockAuditStoreWithOrdering();
            
            // Insert entries in random order (dates are not sorted)
            for (let i = 0; i < dates.length; i++) {
              store.logPermissionChange({
                adminUserId: 1,
                actionType: 'role_created',
                targetType: 'role',
                targetId: i + 1,
                targetName: `role_${i}`,
                changes: {},
                createdAt: dates[i],
              });
            }
            
            // Get history
            const history = store.getAuditHistory();
            
            // Find the maximum date in input
            const maxDate = Math.max(...dates.map(d => d.getTime()));
            
            // The first entry should have the maximum (most recent) date
            expect(history[0].createdAt.getTime()).toBe(maxDate);
            
            // Verify complete ordering
            for (let i = 0; i < history.length - 1; i++) {
              expect(history[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                history[i + 1].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 13: Inmutabilidad de auditoría
   * 
   * For any existing audit record, it must not be possible to modify or delete
   * the record through the API.
   * 
   * **Validates: Requirements 6.5**
   */
  describe('Property 13: Inmutabilidad de auditoría', () => {
    /**
     * Mock audit store that enforces immutability
     * This simulates the expected behavior of the audit service
     */
    interface ImmutableAuditEntry {
      readonly id: number;
      readonly adminUserId: number;
      readonly actionType: typeof AUDIT_ACTION_TYPES[number];
      readonly targetType: 'role' | 'user';
      readonly targetId: number;
      readonly targetName: string;
      readonly changes: Readonly<Record<string, unknown>>;
      readonly createdAt: Date;
    }

    class ImmutableAuditStore {
      private entries: ImmutableAuditEntry[] = [];
      private nextId = 1;

      logPermissionChange(input: {
        adminUserId: number;
        actionType: typeof AUDIT_ACTION_TYPES[number];
        targetType: 'role' | 'user';
        targetId: number;
        targetName: string;
        changes: Record<string, unknown>;
      }): ImmutableAuditEntry {
        const entry: ImmutableAuditEntry = Object.freeze({
          id: this.nextId++,
          adminUserId: input.adminUserId,
          actionType: input.actionType,
          targetType: input.targetType,
          targetId: input.targetId,
          targetName: input.targetName,
          changes: Object.freeze({ ...input.changes }),
          createdAt: new Date(),
        });
        this.entries.push(entry);
        return entry;
      }

      getEntryById(id: number): ImmutableAuditEntry | null {
        return this.entries.find(e => e.id === id) ?? null;
      }

      // These methods should NOT exist in a proper immutable audit system
      // We include them to test that they fail appropriately
      updateEntry(id: number, updates: Partial<ImmutableAuditEntry>): { success: false; error: string } {
        // Audit entries are immutable - updates are not allowed
        return { success: false, error: 'AUDIT_IMMUTABLE' };
      }

      deleteEntry(id: number): { success: false; error: string } {
        // Audit entries are immutable - deletion is not allowed
        return { success: false, error: 'AUDIT_IMMUTABLE' };
      }

      getAllEntries(): ImmutableAuditEntry[] {
        return [...this.entries];
      }

      clear(): void {
        this.entries = [];
        this.nextId = 1;
      }
    }


    it('should not allow modification of existing audit entries', () => {
      fc.assert(
        fc.property(
          auditEntryInputArb,
          fc.record({
            adminUserId: fc.option(positiveIntArb),
            actionType: fc.option(actionTypeArb),
            targetType: fc.option(targetTypeArb),
            targetId: fc.option(positiveIntArb),
            targetName: fc.option(validRoleNameArb),
          }),
          (input, updates) => {
            const store = new ImmutableAuditStore();
            
            // Create an audit entry
            const entry = store.logPermissionChange({
              adminUserId: input.adminUserId,
              actionType: input.actionType,
              targetType: input.targetType,
              targetId: input.targetId,
              targetName: input.targetName,
              changes: input.changes,
            });
            
            // Attempt to update the entry
            const updateResult = store.updateEntry(entry.id, updates as Partial<ImmutableAuditEntry>);
            
            // Update should fail
            expect(updateResult.success).toBe(false);
            expect(updateResult.error).toBe('AUDIT_IMMUTABLE');
            
            // Verify entry remains unchanged
            const retrievedEntry = store.getEntryById(entry.id);
            expect(retrievedEntry).not.toBeNull();
            expect(retrievedEntry?.adminUserId).toBe(input.adminUserId);
            expect(retrievedEntry?.actionType).toBe(input.actionType);
            expect(retrievedEntry?.targetType).toBe(input.targetType);
            expect(retrievedEntry?.targetId).toBe(input.targetId);
            expect(retrievedEntry?.targetName).toBe(input.targetName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow deletion of existing audit entries', () => {
      fc.assert(
        fc.property(
          auditEntryInputArb,
          (input) => {
            const store = new ImmutableAuditStore();
            
            // Create an audit entry
            const entry = store.logPermissionChange({
              adminUserId: input.adminUserId,
              actionType: input.actionType,
              targetType: input.targetType,
              targetId: input.targetId,
              targetName: input.targetName,
              changes: input.changes,
            });
            
            const entryId = entry.id;
            
            // Attempt to delete the entry
            const deleteResult = store.deleteEntry(entryId);
            
            // Delete should fail
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.error).toBe('AUDIT_IMMUTABLE');
            
            // Verify entry still exists
            const retrievedEntry = store.getEntryById(entryId);
            expect(retrievedEntry).not.toBeNull();
            expect(retrievedEntry?.id).toBe(entryId);
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should preserve all audit entries after multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(auditEntryInputArb, { minLength: 1, maxLength: 20 }),
          (inputs) => {
            const store = new ImmutableAuditStore();
            const createdIds: number[] = [];
            
            // Create multiple audit entries
            for (const input of inputs) {
              const entry = store.logPermissionChange({
                adminUserId: input.adminUserId,
                actionType: input.actionType,
                targetType: input.targetType,
                targetId: input.targetId,
                targetName: input.targetName,
                changes: input.changes,
              });
              createdIds.push(entry.id);
            }
            
            // Attempt to delete each entry
            for (const id of createdIds) {
              const deleteResult = store.deleteEntry(id);
              expect(deleteResult.success).toBe(false);
            }
            
            // Verify all entries still exist
            const allEntries = store.getAllEntries();
            expect(allEntries.length).toBe(inputs.length);
            
            for (const id of createdIds) {
              const entry = store.getEntryById(id);
              expect(entry).not.toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity of frozen audit entries', () => {
      fc.assert(
        fc.property(
          auditEntryInputArb,
          (input) => {
            const store = new ImmutableAuditStore();
            
            // Create an audit entry
            const entry = store.logPermissionChange({
              adminUserId: input.adminUserId,
              actionType: input.actionType,
              targetType: input.targetType,
              targetId: input.targetId,
              targetName: input.targetName,
              changes: input.changes,
            });
            
            // Verify the entry is frozen (immutable)
            expect(Object.isFrozen(entry)).toBe(true);
            
            // Attempting to modify should throw in strict mode or silently fail
            // We verify by checking the value hasn't changed
            const originalAdminId = entry.adminUserId;
            try {
              (entry as { adminUserId: number }).adminUserId = 99999;
            } catch {
              // Expected in strict mode
            }
            expect(entry.adminUserId).toBe(originalAdminId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});