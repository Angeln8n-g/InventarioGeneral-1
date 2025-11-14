'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LoanCard } from '@/components/dashboard/LoanCard'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Header } from '@/components/layout/Header'

/**
 * Visual Testing Page for Claro Theme
 * 
 * This page provides a comprehensive visual test suite for all components
 * in both light and dark modes. Use this to verify:
 * - Color accuracy
 * - Contrast ratios
 * - Component states (normal, hover, active, disabled)
 * - Theme transitions
 * - Badge and alert visibility
 */

export default function VisualTestPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(false)

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const mockNotifications = [
    {
      id: 1,
      type: 'warning' as const,
      title: 'Test Warning',
      message: 'This is a warning notification',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: 'success' as const,
      title: 'Test Success',
      message: 'This is a success notification',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]

  const mockLoan = {
    id: 1,
    tool_instance: {
      serial_number: 'TEST-001',
      item_type: {
        name: 'Test Tool',
        description: 'A test tool for visual testing',
      },
    },
    due_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'active',
  }

  const mockOverdueLoan = {
    ...mockLoan,
    id: 2,
    due_date: new Date(Date.now() - 86400000).toISOString(),
    status: 'overdue',
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      {/* Theme Toggle Header */}
      <div className="sticky top-0 z-50 bg-claro-red text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Claro Theme Visual Testing</h1>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-white text-claro-red rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {theme === 'light' ? '🌙 Switch to Dark' : '☀️ Switch to Light'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Section 1: Button States */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            1. Button Component States
          </h2>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
              Primary Variant
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" size="sm">Small Primary</Button>
              <Button variant="primary" size="md">Medium Primary</Button>
              <Button variant="primary" size="lg">Large Primary</Button>
              <Button variant="primary" disabled>Disabled Primary</Button>
              <Button variant="primary" isLoading>Loading Primary</Button>
            </div>
          </div>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
              Secondary Variant
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="sm">Small Secondary</Button>
              <Button variant="secondary" size="md">Medium Secondary</Button>
              <Button variant="secondary" size="lg">Large Secondary</Button>
              <Button variant="secondary" disabled>Disabled Secondary</Button>
            </div>
          </div>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
              Danger Variant
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="danger" size="sm">Small Danger</Button>
              <Button variant="danger" size="md">Medium Danger</Button>
              <Button variant="danger" size="lg">Large Danger</Button>
              <Button variant="danger" disabled>Disabled Danger</Button>
            </div>
          </div>
        </section>

        {/* Section 2: Card States */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            2. Card Component States
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
                Normal Card (Active Loan)
              </h3>
              <LoanCard
                loan={mockLoan as any}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
                Overdue Card
              </h3>
              <LoanCard
                loan={mockOverdueLoan as any}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
                Loading State
              </h3>
              <LoanCard
                loan={mockLoan as any}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-text-light dark:text-text-dark">
                Hover Test (Hover over this card)
              </h3>
              <LoanCard
                loan={mockLoan as any}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Badges and Alerts */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            3. Badges and Alerts
          </h2>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <span className="claro-badge-active px-4 py-2 rounded-full text-sm font-medium">
                Active Badge
              </span>
              <span className="claro-badge-warning px-4 py-2 rounded-full text-sm font-medium">
                Warning Badge
              </span>
              <span className="claro-badge-error px-4 py-2 rounded-full text-sm font-medium">
                Error Badge
              </span>
              <span className="bg-claro-red text-white px-4 py-2 rounded-full text-sm font-medium">
                Notification Badge (3)
              </span>
              <span className="bg-claro-blue text-white px-4 py-2 rounded-full text-sm font-medium">
                Info Badge
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-claro-green/10 border-l-4 border-claro-green p-4 rounded">
              <p className="text-claro-green font-medium">Success Alert: Operation completed successfully</p>
            </div>
            <div className="bg-claro-warning/10 border-l-4 border-claro-warning p-4 rounded">
              <p className="text-claro-warning font-medium">Warning Alert: Please review your pending items</p>
            </div>
            <div className="bg-claro-red/10 border-l-4 border-claro-red p-4 rounded">
              <p className="text-claro-red font-medium">Error Alert: Something went wrong</p>
            </div>
            <div className="bg-claro-blue/10 border-l-4 border-claro-blue p-4 rounded">
              <p className="text-claro-blue font-medium">Info Alert: New features available</p>
            </div>
          </div>
        </section>

        {/* Section 4: Navigation States */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            4. Navigation Component
          </h2>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Scroll to the bottom to see the BottomNavigation component with badges
            </p>
          </div>
        </section>

        {/* Section 5: Header Component */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            5. Header Component
          </h2>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              The Header component is visible at the top of the page with real notifications from the API.
            </p>
            <div className="bg-claro-red/10 border border-claro-red/30 rounded-lg p-4">
              <p className="text-sm text-text-light dark:text-text-dark">
                ℹ️ The unified Header component is now used across the entire application with real-time notifications.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Color Palette Reference */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            6. Color Palette Reference
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 bg-claro-red rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Claro Red</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">#E30613</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-claro-green rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Claro Green</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">#4CAF50</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-claro-warning rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Claro Warning</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">#FF9800</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-claro-blue rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Claro Blue</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">#1976D2</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Background</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {theme === 'light' ? '#F4F4F4' : '#121212'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Card</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {theme === 'light' ? '#FFFFFF' : '#1E1E1E'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-text-light dark:bg-text-dark rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Text Primary</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {theme === 'light' ? '#212121' : '#FFFFFF'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 bg-text-secondary-light dark:bg-text-secondary-dark rounded-lg"></div>
              <p className="text-sm font-medium text-text-light dark:text-text-dark">Text Secondary</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {theme === 'light' ? '#757575' : '#A3A3A3'}
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Contrast Testing */}
        <section className="space-y-6 mb-32">
          <h2 className="text-3xl font-bold text-text-light dark:text-text-dark">
            7. Contrast Testing
          </h2>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="bg-background-light dark:bg-background-dark p-4 rounded">
              <p className="text-text-light dark:text-text-dark">
                Primary text on background (should be highly readable)
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Secondary text on background (should be readable but less prominent)
              </p>
            </div>

            <div className="bg-claro-red p-4 rounded">
              <p className="text-white font-medium">
                White text on Claro Red (should be highly readable)
              </p>
            </div>

            <div className="bg-white dark:bg-card-dark p-4 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-claro-red font-medium">
                Claro Red text on white/card background (should be readable)
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <MobileNavigation />
    </div>
  )
}
