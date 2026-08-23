import { supabase } from '../supabase'
import type { User, CreateUserInput, UpdateUserInput } from '@/types/database'

export const userOperations = {
  async getById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
