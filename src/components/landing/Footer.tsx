'use client'

import React from 'react'

export default function Footer() {
  return (
    <footer className="py-8 px-4 bg-gray-900 text-white">
      <div className="container mx-auto text-center">
        <div className="mb-4">
          <span className="text-2xl">🗃️</span>
          <span className="text-xl font-bold ml-2">Inventario SGI </span>
          <span className="text-2xl">🛠️</span>
        </div>
        <p className="text-gray-400 mb-2">
          Sistema de Gestión de Inventario para Instituciones Educativas
        </p>
        <p className="text-gray-500 text-sm">
          Versión 10.0 | © 2025 Angel Santana
        </p>
      </div>
    </footer>
  )
}
