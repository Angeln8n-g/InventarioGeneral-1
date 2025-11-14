'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function CTASection() {
  return (
    <section className="py-20 px-4 bg-primary text-white">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">
          ¿Listo para Optimizar tu Inventario?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Únete a las instituciones que ya confían en Inventario SGI
          para gestionar sus recursos de forma eficiente.
        </p>
        <Link href="/login">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100"
          >
            Comenzar Ahora
          </Button>
        </Link>
      </div>
    </section>
  )
}
