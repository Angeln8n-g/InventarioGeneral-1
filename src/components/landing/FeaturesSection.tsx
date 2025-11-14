'use client'

import React from 'react'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: '📱',
    title: 'Dashboard Mobile-First',
    description: 'Interfaz optimizada para dispositivos móviles con acciones rápidas y navegación intuitiva'
  },
  {
    icon: '📷',
    title: 'Escaneo QR',
    description: 'Préstamos y devoluciones rápidas mediante códigos QR para mayor eficiencia'
  },
  {
    icon: '📦',
    title: 'Gestión de Materiales Gastables',
    description: 'Control completo de materiales consumibles con solicitudes y aprobaciones'
  },
  {
    icon: '📊',
    title: 'Reportes y Estadísticas',
    description: 'Visualiza métricas importantes y genera reportes detallados del inventario'
  },
  {
    icon: '🔔',
    title: 'Notificaciones',
    description: 'Sistema de alertas para préstamos pendientes, devoluciones y actualizaciones'
  },
  {
    icon: '🌙',
    title: 'Modo Oscuro',
    description: 'Interfaz adaptable con soporte completo para tema claro y oscuro'
  }
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Características Principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
