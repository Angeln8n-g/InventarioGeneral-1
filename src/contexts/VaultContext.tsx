'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface VaultItem {
  id: number // tool_id
  tool_id: number
  loan_id: number // ID del préstamo a devolver
  name: string
  description?: string
  category?: string
  serial_number?: string
  qr_code: string
  status: string
}

interface VaultContextType {
  items: VaultItem[]
  addItem: (item: VaultItem) => void
  removeItem: (toolId: number) => void
  clearVault: () => void
  getTotalItems: () => number
  isInVault: (toolId: number) => boolean
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load vault from localStorage on mount
  useEffect(() => {
    const savedVault = localStorage.getItem('tools_vault')
    if (savedVault) {
      try {
        const parsed = JSON.parse(savedVault)
        setItems(parsed)
      } catch (error) {
        console.error('Error loading vault from localStorage:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save vault to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tools_vault', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addItem = (item: VaultItem) => {
    setItems((prevItems) => {
      // Check if tool already in vault
      const exists = prevItems.some((i) => i.tool_id === item.tool_id)
      if (exists) {
        console.warn('Tool already in vault:', item.name)
        return prevItems
      }

      // Add new tool
      return [...prevItems, item]
    })
  }

  const removeItem = (toolId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.tool_id !== toolId))
  }

  const clearVault = () => {
    setItems([])
    localStorage.removeItem('tools_vault')
  }

  const getTotalItems = () => {
    return items.length
  }

  const isInVault = (toolId: number) => {
    return items.some((item) => item.tool_id === toolId)
  }

  return (
    <VaultContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearVault,
        getTotalItems,
        isInVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}
