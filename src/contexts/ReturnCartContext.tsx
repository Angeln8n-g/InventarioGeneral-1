'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface ReturnCartItem {
  id: number
  name: string
  description?: string
  quantity: number
  consumption_date: string
  max_returnable: number
  unit_of_measure?: string
  consumable_stock_id: number
  segment_start?: number
  segment_end?: number
  unique_key: string
}

interface ReturnCartContextType {
  items: ReturnCartItem[]
  addItem: (item: Omit<ReturnCartItem, 'quantity' | 'unique_key'>, quantity: number) => void
  removeItem: (uniqueKey: string) => void
  updateQuantity: (uniqueKey: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalQuantity: number
}

const ReturnCartContext = createContext<ReturnCartContextType | undefined>(undefined)

const STORAGE_KEY = 'return_cart'

export function ReturnCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReturnCartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setItems(parsed)
      }
    } catch (error) {
      console.error('Failed to load return cart from storage:', error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save return cart to storage:', error)
    }
  }, [items])

  const addItem = useCallback((item: Omit<ReturnCartItem, 'quantity' | 'unique_key'>, quantity: number) => {
    setItems((prevItems) => {
      const baseKey = `${item.id}-${item.consumption_date}-${item.consumable_stock_id}`
      const unique_key = (item.segment_start !== undefined && item.segment_end !== undefined)
        ? `${baseKey}-${item.segment_start}-${item.segment_end}`
        : baseKey
      // Check if item already exists
      const existingIndex = prevItems.findIndex((i) => i.unique_key === unique_key)

      if (existingIndex >= 0) {
        // Update quantity, but don't exceed max_returnable
        const newItems = [...prevItems]
        const newQuantity = Math.min(
          prevItems[existingIndex].quantity + quantity,
          item.max_returnable
        )
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newQuantity,
        }
        return newItems
      }

      // Add new item
      const validQuantity = Math.min(quantity, item.max_returnable)
      return [...prevItems, { ...item, quantity: validQuantity, unique_key }]
    })
  }, [])

  const removeItem = useCallback((uniqueKey: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.unique_key !== uniqueKey))
  }, [])

  const updateQuantity = useCallback((uniqueKey: string, quantity: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems]
      const index = newItems.findIndex((item) => item.unique_key === uniqueKey)
      
      if (index >= 0) {
        const validQuantity = Math.max(1, Math.min(quantity, newItems[index].max_returnable))
        newItems[index] = {
          ...newItems[index],
          quantity: validQuantity,
        }
      }
      
      return newItems
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const totalItems = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <ReturnCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalQuantity,
      }}
    >
      {children}
    </ReturnCartContext.Provider>
  )
}

export function useReturnCart() {
  const context = useContext(ReturnCartContext)
  if (context === undefined) {
    throw new Error('useReturnCart must be used within a ReturnCartProvider')
  }
  return context
}
