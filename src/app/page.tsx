'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { loadFromStorage } from '@/features/auth/authSlice'
import Navigation from '@/components/landing/Navigation'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import TechnologySection from '@/components/landing/TechnologySection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  )
}