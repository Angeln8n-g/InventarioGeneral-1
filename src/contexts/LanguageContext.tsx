'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import enTranslations from '@/locales/en.json'
import esTranslations from '@/locales/es.json'

export type Language = 'en' | 'es'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, variables?: Record<string, string | number>) => string
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'relative') => string
  formatNumber: (num: number) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  es: esTranslations,
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // Update HTML lang attribute when language changes
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }, [])

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // Get translation from current language
      let translation = translations[language]?.[key]

      // Fallback to English if translation not found in current language
      if (!translation && language !== 'en') {
        translation = translations.en[key]
        if (translation) {
          console.warn(`Translation missing for key: ${key} in ${language}, using English fallback`)
        }
      }

      // If still no translation found, show key
      if (!translation) {
        return key
      }

      // Handle variable interpolation
      if (variables) {
        return Object.entries(variables).reduce(
          (text, [varName, value]) => text.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(value)),
          translation
        )
      }

      return translation
    },
    [language]
  )

  const formatDate = useCallback(
    (date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date

      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date'
      }

      const locale = language === 'es' ? 'es-ES' : 'en-US'

      if (format === 'relative') {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

        if (diffInSeconds < 60) {
          return language === 'es' ? 'Justo ahora' : 'Just now'
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60)
          return language === 'es'
            ? `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`
            : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600)
          return language === 'es'
            ? `Hace ${hours} hora${hours !== 1 ? 's' : ''}`
            : `${hours} hour${hours !== 1 ? 's' : ''} ago`
        } else if (diffInSeconds < 2592000) {
          const days = Math.floor(diffInSeconds / 86400)
          return language === 'es'
            ? `Hace ${days} día${days !== 1 ? 's' : ''}`
            : `${days} day${days !== 1 ? 's' : ''} ago`
        } else if (diffInSeconds < 31536000) {
          const months = Math.floor(diffInSeconds / 2592000)
          return language === 'es'
            ? `Hace ${months} mes${months !== 1 ? 'es' : ''}`
            : `${months} month${months !== 1 ? 's' : ''} ago`
        } else {
          const years = Math.floor(diffInSeconds / 31536000)
          return language === 'es'
            ? `Hace ${years} año${years !== 1 ? 's' : ''}`
            : `${years} year${years !== 1 ? 's' : ''} ago`
        }
      } else if (format === 'long') {
        return dateObj.toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } else {
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      }
    },
    [language]
  )

  const formatNumber = useCallback(
    (num: number): string => {
      const locale = language === 'es' ? 'es-ES' : 'en-US'
      return num.toLocaleString(locale)
    },
    [language]
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      formatNumber,
    }),
    [language, setLanguage, t, formatDate, formatNumber]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
