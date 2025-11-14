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
}

interface ReturnCartContextType {
  items: ReturnCartItem[]
  addItem: (item: Omit<ReturnCartItem, 'quantity'>, quantity: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
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

  const addItem = useCallback((item: Omit<ReturnCartItem, 'quantity'>, quantity: number) => {
    setItems((prevItems) => {
      // Check if item already exists
      const existingIndex = prevItems.findIndex(
        (i) => i.id === item.id && i.consumption_date === item.consumption_date
      )

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
      return [...prevItems, { ...item, quantity: validQuantity }]
    })
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: number, quantity: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems]
      const index = newItems.findIndex((item) => item.id === id)
      
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
