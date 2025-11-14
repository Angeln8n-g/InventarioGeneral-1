'use client'

import React from 'react'

interface BenefitColumnProps {
  title: string
  icon: string
  benefits: string[]
}

const userBenefits = [
  'Préstamos rápidos con escaneo QR',
  'Seguimiento de herramientas prestadas',
  'Solicitud de materiales gastables',
  'Notificaciones de devoluciones',
  'Historial completo de préstamos',
  'Interfaz intuitiva y fácil de usar'
]

const adminBenefits = [
  'Gestión completa de inventario',
  'Control de usuarios y permisos',
  'Reportes detallados y estadísticas',
  'Registro de auditoría completo',
  'Gestión de stock de materiales gastables',
  'Dashboard con métricas en tiempo real'
]

function BenefitColumn({ title, icon, benefits }: BenefitColumnProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <span className="text-4xl mr-3">{icon}</span>
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      <ul className="space-y-4">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-6 h-6 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function BenefitsSection() {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Diseñado para Todos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <BenefitColumn
            title="Para Usuarios"
            icon="👤"
            benefits={userBenefits}
          />
          <BenefitColumn
            title="Para Administradores"
            icon="👨‍💼"
            benefits={adminBenefits}
          />
        </div>
      </div>
    </section>
  )
}
