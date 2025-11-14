'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary fade-in">
          🗃️ Inventario SGI 🛠️
        </h1>
        <h2 className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-4 slide-up-delay-1">
          Sistema de Gestión de Inventario
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto slide-up-delay-2">
          Solución completa para instituciones educativas. Gestiona herramientas,
          consumibles y préstamos de forma eficiente y profesional.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up-delay-3">
          <Link href="/login">
            <Button size="lg">
              Iniciar Sesión
            </Button>
          </Link>
          <Button size="lg" variant="secondary" onClick={scrollToFeatures}>
            Conocer Más
          </Button>
        </div>
      </div>
    </section>
  )
}
