import { supabase } from '../supabase'
import type {
  Loan,
  CreateLoanInput,
  UpdateLoanInput,
  LoanFilters,
} from '@/types/database'

export const loanOperations = {
  async getAll(filters?: LoanFilters): Promise<Loan[]> {
    let query = supabase
      .from('loans')
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .order('created_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.overdue) {
      query = query.lt('due_date', new Date().toISOString())
        .eq('status', 'active')
    }
    if (filters?.start_date) {
      query = query.gte('loan_date', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('loan_date', filters.end_date)
    }
    if (filters?.limit) {
      if (filters.offset !== undefined) {
        query = query.range(filters.offset, filters.offset + filters.limit - 1)
      } else {
        query = query.limit(filters.limit)
      }
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<Loan | null> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getActiveByUserId(userId: number): Promise<Loan[]> {
    return this.getAll({ user_id: userId, status: 'active' })
  },

  async getOverdueLoans(): Promise<Loan[]> {
    return this.getAll({ overdue: true })
  },

  async create(input: CreateLoanInput): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert(input)
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateLoanInput): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async returnTool(id: number): Promise<Loan> {
    return this.update(id, {
      return_date: new Date().toISOString(),
      status: 'returned'
    })
  },

  async returnToolAtomic(loanId: number, conditionNotes?: string, toolStatus = 'available') {
    const { data, error } = await supabase.rpc('return_tool_atomic', {
      p_loan_id: loanId,
      p_condition_notes: conditionNotes || null,
      p_tool_status: toolStatus,
    })

    if (error) throw error
    return data
  },

  async createBatchAtomic(
    userId: number,
    toolInstanceIds: number[],
    dueDate: string,
    notes?: string,
    maxLoans = 10
  ) {
    const { data, error } = await supabase.rpc('create_batch_loans_atomic', {
      p_user_id: userId,
      p_tool_instance_ids: toolInstanceIds,
      p_due_date: dueDate,
      p_notes: notes || null,
      p_max_loans: maxLoans,
    })

    if (error) throw error
    return data
  },

  async markOverdue(id: number): Promise<Loan> {
    return this.update(id, { status: 'overdue' })
  },
}
