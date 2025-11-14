'use client'

import React from 'react'

interface Technology {
  name: string
  description: string
}

const technologies: Technology[] = [
  { name: 'Next.js 15', description: 'Framework React moderno' },
  { name: 'TypeScript', description: 'Tipado estático' },
  { name: 'Supabase', description: 'Base de datos PostgreSQL' },
  { name: 'Tailwind CSS', description: 'Estilos modernos' }
]

const securityFeatures = [
  'Autenticación JWT segura',
  'Control de roles y permisos',
  'Validación de datos con Yup',
  'Protección de rutas',
  'Sanitización de inputs',
  'HTTPS en producción'
]

export default function TechnologySection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Tecnología Confiable
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">Stack Moderno</h3>
            <div className="grid grid-cols-2 gap-4">
              {technologies.map((tech, index) => (
                <div
                  key={index}
                  className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow text-center"
                >
                  <div className="font-bold text-primary mb-1">{tech.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{tech.description}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-6">Seguridad Garantizada</h3>
            <ul className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
