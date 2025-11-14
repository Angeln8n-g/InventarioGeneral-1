'use client'

import React from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { Button } from '@/components/ui/Button'

export default function Navigation() {
  const { user, token } = useSelector((state: RootState) => state.auth)

  return (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🗃️</span>
          <span className="text-xl font-bold">Inventario SGI</span>
          <span className="text-2xl">🛠️</span>
        </Link>
        
        {token && user ? (
          <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}>
            <Button>
              Ir al Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button>
              Iniciar Sesión
            </Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
