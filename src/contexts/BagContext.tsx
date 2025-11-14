'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface BagItem {
  id: number // tool_id
  tool_id: number
  name: string
  description?: string
  category?: string
  serial_number?: string
  qr_code: string
  status: string
}

interface BagContextType {
  items: BagItem[]
  addItem: (item: BagItem) => void
  removeItem: (toolId: number) => void
  clearBag: () => void
  getTotalItems: () => number
  isInBag: (toolId: number) => boolean
}

const BagContext = createContext<BagContextType | undefined>(undefined)

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load bag from localStorage on mount
  useEffect(() => {
    const savedBag = localStorage.getItem('tools_bag')
    if (savedBag) {
      try {
        const parsed = JSON.parse(savedBag)
        setItems(parsed)
      } catch (error) {
        console.error('Error loading bag from localStorage:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save bag to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tools_bag', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (item: BagItem) => {
    setItems((prevItems) => {
      // Check if tool already in bag
      const exists = prevItems.some((i) => i.tool_id === item.tool_id)
      if (exists) {
        console.warn('Tool already in bag:', item.name)
        return prevItems
      }

      // Add new tool
      return [...prevItems, item]
    })
  }

  const removeItem = (toolId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.tool_id !== toolId))
  }

  const clearBag = () => {
    setItems([])
    localStorage.removeItem('tools_bag')
  }

  const getTotalItems = () => {
    return items.length
  }

  const isInBag = (toolId: number) => {
    return items.some((item) => item.tool_id === toolId)
  }

  return (
    <BagContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearBag,
        getTotalItems,
        isInBag,
      }}
    >
      {children}
    </BagContext.Provider>
  )
}

export function useBag() {
  const context = useContext(BagContext)
  if (context === undefined) {
    throw new Error('useBag must be used within a BagProvider')
  }
  return context
}
