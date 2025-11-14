export interface BatchResult<T = unknown> {
  success: boolean
  processed: number
  failed: number
  results: T[]
  errors: Array<{ itemId: string | number; error: string }>
}

export interface ProgressCallback {
  (completed: number, total: number, failed: number): void
}

export interface BatchItem {
  id: string | number
  [key: string]: unknown
}

export class BatchProcessor {
  private maxConcurrent = 5
  private retryAttempts = 3
  private retryDelay = 1000 // ms

  constructor(maxConcurrent?: number, retryAttempts?: number) {
    if (maxConcurrent) this.maxConcurrent = maxConcurrent
    if (retryAttempts) this.retryAttempts = retryAttempts
  }

  /**
   * Process loans in batch
   */
  async processLoans(
    toolInstanceIds: number[],
    notes?: string,
    onProgress?: ProgressCallback
  ): Promise<BatchResult> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    return this.processWithProgress(
      toolInstanceIds.map(id => ({ id, tool_instance_id: id })),
      async (item) => {
        const response = await fetch('/api/loans/batch', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tool_instance_ids: [item.tool_instance_id],
            notes,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to create loan')
        }

        return response.json()
      },
      onProgress
    )
  }

  /**
   * Process returns in batch
   */
  async processReturns(
    loanIds: number[],
    notes?: string,
    onProgress?: ProgressCallback
  ): Promise<BatchResult> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    return this.processWithProgress(
      loanIds.map(id => ({ id, loan_id: id })),
      async (item) => {
        const response = await fetch('/api/loans/batch/return', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            loan_ids: [item.loan_id],
            notes,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to return loan')
        }

        return response.json()
      },
      onProgress
    )
  }

  /**
   * Process consumables in batch
   */
  async processConsumables(
    consumptions: Array<{ item_type_id: number; quantity: number; notes?: string }>,
    onProgress?: ProgressCallback
  ): Promise<BatchResult> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    return this.processWithProgress(
      consumptions.map(c => ({ id: c.item_type_id, ...c })),
      async (item) => {
        const response = await fetch('/api/consumables/batch/consume', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            consumptions: [{
              item_type_id: item.item_type_id,
              quantity: item.quantity,
              notes: item.notes,
            }],
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to consume item')
        }

        return response.json()
      },
      onProgress
    )
  }

  /**
   * Process items with progress tracking and retry logic
   */
  private async processWithProgress<T extends BatchItem>(
    items: T[],
    processor: (item: T) => Promise<unknown>,
    onProgress?: ProgressCallback
  ): Promise<BatchResult> {
    const results: unknown[] = []
    const errors: Array<{ itemId: string | number; error: string }> = []
    let completed = 0
    let failed = 0

    // Process items in chunks to control concurrency
    for (let i = 0; i < items.length; i += this.maxConcurrent) {
      const chunk = items.slice(i, i + this.maxConcurrent)
      
      const chunkResults = await Promise.allSettled(
        chunk.map(item => this.processWithRetry(item, processor))
      )

      chunkResults.forEach((result, index) => {
        const item = chunk[index]
        
        if (result.status === 'fulfilled') {
          results.push(result.value)
          completed++
        } else {
          errors.push({
            itemId: item.id,
            error: result.reason?.message || 'Unknown error',
          })
          failed++
        }

        // Call progress callback
        if (onProgress) {
          onProgress(completed, items.length, failed)
        }
      })
    }

    return {
      success: errors.length === 0,
      processed: completed,
      failed,
      results,
      errors,
    }
  }

  /**
   * Process a single item with retry logic
   */
  private async processWithRetry<T>(
    item: T,
    processor: (item: T) => Promise<unknown>,
    attempt = 1
  ): Promise<unknown> {
    try {
      return await processor(item)
    } catch (error) {
      // Check if error is retryable (network errors)
      const isRetryable = this.isRetryableError(error)
      
      if (isRetryable && attempt < this.retryAttempts) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        await this.sleep(delay)
        return this.processWithRetry(item, processor, attempt + 1)
      }

      throw error
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true // Network error
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection')
      )
    }

    return false
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor()
