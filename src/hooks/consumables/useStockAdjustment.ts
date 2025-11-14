// Phase 3, Task 13: useStockAdjustment hook (admin only)

import { useState, useCallback } from 'react'
import { StockAdjustmentAction } from '@/types/consumables'

interface UseStockAdjustmentOptions {
  onSuccess?: () => void
}

export function useStockAdjustment({ onSuccess }: UseStockAdjustmentOptions = {}) {
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustingStockId, setAdjustingStockId] = useState<number | null>(null)

  const adjustStock = useCallback(async (
    stockId: number,
    action: StockAdjustmentAction,
    quantity: number
  ) => {
    setIsAdjusting(true)
    setAdjustingStockId(stockId)

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

      alert('Stock adjusted successfully!')

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to adjust stock: ${errorMessage}`)
      throw err
    } finally {
      setIsAdjusting(false)
      setAdjustingStockId(null)
    }
  }, [onSuccess])

  return {
    adjustStock,
    isAdjusting,
    adjustingStockId,
  }
}
