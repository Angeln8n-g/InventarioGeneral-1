// Phase 3, Task 12: useConsumables hook

import { useState, useEffect, useCallback } from 'react'
import { ConsumableItem, ConsumableStockAdmin, UserRole } from '@/types/consumables'

interface UseConsumablesOptions {
  role: UserRole
  autoFetch?: boolean
}

export function useConsumables({ role, autoFetch = true }: UseConsumablesOptions) {
  const [consumables, setConsumables] = useState<ConsumableItem[] | ConsumableStockAdmin[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConsumables = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = role === 'admin' 
        ? '/api/admin/consumables?include_requests=true'
        : '/api/consumables'

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch consumables')
      }

      const data = await response.json()
      setConsumables(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Fetch consumables error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [role])

  const requestConsumable = useCallback(async (itemTypeId: number, quantity: number) => {
    try {
      const response = await fetch('/api/consumables/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          item_type_id: itemTypeId,
          requested_quantity: quantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to request consumable')
      }

      const data = await response.json()

      // Show success message
      if (data.fulfilled) {
        alert('Request fulfilled successfully! Items have been allocated to you.')
      } else {
        alert('Request created successfully! You will be notified when items are available.')
      }

      // Refresh data
      await fetchConsumables()
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to request consumable: ${errorMessage}`)
      throw err
    }
  }, [fetchConsumables])

  const adjustStock = useCallback(async (stockId: number, action: string, quantity?: number) => {
    try {
      const response = await fetch('/api/admin/consumables', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: `${action}_stock`,
          stock_id: stockId,
          quantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to adjust stock')
      }

      // Show success message
      alert('Stock adjusted successfully!')

      // Refresh data
      await fetchConsumables()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to adjust stock: ${errorMessage}`)
      throw err
    }
  }, [fetchConsumables])

  useEffect(() => {
    if (autoFetch) {
      fetchConsumables()
    }
  }, [autoFetch, fetchConsumables])

  return {
    consumables,
    isLoading,
    error,
    fetchConsumables,
    requestConsumable,
    adjustStock,
    refetch: fetchConsumables,
  }
}
