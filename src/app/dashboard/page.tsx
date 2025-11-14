'use client'

import React, { useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useGetMyLoansQuery, useGetNotificationsQuery } from '@/services/api'
import { Header } from '@/components/layout/Header'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { useViewTransition } from '@/hooks/useViewTransition'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

// Lazy load modals for better performance
const LoanDetailsModal = lazy(() => import('@/components/dashboard/LoanDetailsModal').then(m => ({ default: m.LoanDetailsModal })))
const RequestMaterialsModal = lazy(() => import('@/components/dashboard/RequestMaterialsModal').then(m => ({ default: m.RequestMaterialsModal })))
const ReturnMaterialsModal = lazy(() => import('@/components/dashboard/ReturnMaterialsModal').then(m => ({ default: m.ReturnMaterialsModal })))
const RequestToolsModal = lazy(() => import('@/components/dashboard/RequestToolsModal').then(m => ({ default: m.RequestToolsModal })))
const ReturnToolsModal = lazy(() => import('@/components/dashboard/ReturnToolsModal').then(m => ({ default: m.ReturnToolsModal })))

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: loansData, isLoading: isLoadingLoans, refetch: refetchLoans } = useGetMyLoansQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
  })
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRequestMaterialsModalOpen, setIsRequestMaterialsModalOpen] = useState(false)
  const [isReturnMaterialsModalOpen, setIsReturnMaterialsModalOpen] = useState(false)
  const [isRequestToolsModalOpen, setIsRequestToolsModalOpen] = useState(false)
  const [isReturnToolsModalOpen, setIsReturnToolsModalOpen] = useState(false)
  
  // View transitions for navigation
  const { startTransition } = useViewTransition({
    speed: 'normal',
    direction: 'forward',
    enableHaptics: true,
  })


  // Fetch notifications silently - don't block UI if it fails
  useGetNotificationsQuery(
    { page: 1, limit: 20 },
    {
      skip: !user,
      pollingInterval: 30000, // Poll every 30 seconds
      skipPollingIfUnfocused: true, // Stop polling when tab is not focused
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: true,
      refetchOnFocus: false, // CRITICAL: Prevent refetch when keyboard closes on mobile
    }
  )

  // Extract active loans from the response structure
  const loansResponse = loansData?.data as unknown as { active?: unknown[]; overdue?: unknown[] } | undefined
  const activeLoans = loansResponse?.active || []
  const overdueLoans = loansResponse?.overdue || []
  const allActiveLoans = [...activeLoans, ...overdueLoans]

  const userName = (user as { full_name?: string; username: string })?.full_name || user?.username || 'User'

  const handleLoanClick = (loanId: number) => {
    setSelectedLoanId(loanId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedLoanId(null)
  }

  const handleNavigateLoan = (id: number) => {
    setSelectedLoanId(id)
  }

  const handleReturnFromModal = () => {
    setIsModalOpen(false)
    setIsReturnToolsModalOpen(true)
  }

  // Action cards configuration - 4 cards in 2x2 grid
  const actions = [
    {
      id: 'scan-consumables',
      title: 'Solicitar Materiales',
      description: 'Escanea códigos QR de materiales para registrar uso',
      icon: '🏪',
      onClick: () => setIsRequestMaterialsModalOpen(true),
      variant: 'highlighted' as const,
    },
    {
      id: 'solicitar-herramientas',
      title: 'Solicitar Herramientas o equipos',
      description: 'Escanea herramientas para crear un préstamo',
      icon: '💼',
      onClick: () => setIsRequestToolsModalOpen(true),
      variant: 'highlighted' as const,
    },/*
    {
      id: 'return-consumables',
      title: 'Devolver Materiales',
      description: 'Devuelve materiales no utilizados de tus prácticas',
      icon: '♻️',
      onClick: () => setIsReturnMaterialsModalOpen(true),
      variant: 'highlighted' as const,
    },
    {
      id: 'devolver-herramientas',
      title: 'Devolver Herramientas o equipos',
      description: 'Escanea herramientas para devolverlas',
      icon: '🏛️',
      onClick: () => setIsReturnToolsModalOpen(true),
      variant: 'highlighted' as const,
    },*/
  ]

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true} showIndicators={false}>
        <div className="min-h-screen relative pb-20">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/images/dashboard-background.jpg"
            alt="Dashboard background"
            fill
            priority
            quality={90}
            className="object-cover"
          />
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-white/40 dark:bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <Header
            title={`Hello, ${userName}!`}
            showNotifications={true}
            showUserMenu={true}
          />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto pt-20 px-4 py-6">
            {/* Action Cards Grid - Responsive 2 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 max-w-4xl mx-auto">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="relative flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 rounded-2xl transition-all active:scale-95 hover:shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-claro-red min-h-[180px] sm:min-h-[200px] md:min-h-[220px]"
                >
                  {/* Icon */}
                  <div className="mb-3 sm:mb-4 text-5xl sm:text-6xl md:text-7xl">
                    {action.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-center mb-1 sm:mb-2 text-gray-900 dark:text-white px-2">
                    {action.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 px-2">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Active Loans Section - Only show if there are active loans or loading */}
            {(isLoadingLoans || allActiveLoans.length > 0) && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 px-4">
                  Active Loans
                </h2>

                {isLoadingLoans ? (
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading loans...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allActiveLoans.slice(0, 3).map((loan: any) => (
                      <div
                        key={loan.id}
                        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-claro-red transition-colors"
                        onClick={() => handleLoanClick(loan.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {loan.tool_instance?.item_type?.name || 'Unknown Tool'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {loan.tool_instance?.serial_number ? `#${loan.tool_instance.serial_number}` : 'No serial'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsReturnToolsModalOpen(true)
                            }}
                            className="px-4 py-2 bg-claro-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                          >
                            Return
                          </button>
                        </div>
                      </div>
                    ))}
                    {allActiveLoans.length > 3 && (
                      <button
                        onClick={() => router.push('/my-loans')}
                        className="w-full py-3 text-claro-red font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        View All ({allActiveLoans.length}) →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Bottom Navigation */}
          <MobileNavigation />

          {/* Modals - Lazy loaded for better performance */}
          <Suspense fallback={null}>
            {isModalOpen && (
              <LoanDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                loanId={selectedLoanId}
                loans={allActiveLoans as any[]}
                onNavigate={handleNavigateLoan}
                onReturn={handleReturnFromModal}
              />
            )}

            {isRequestMaterialsModalOpen && (
              <RequestMaterialsModal
                isOpen={isRequestMaterialsModalOpen}
                onClose={() => setIsRequestMaterialsModalOpen(false)}
                onSuccess={() => {
                  refetchLoans()
                }}
              />
            )}

            {isReturnMaterialsModalOpen && (
              <ReturnMaterialsModal
                isOpen={isReturnMaterialsModalOpen}
                onClose={() => setIsReturnMaterialsModalOpen(false)}
                onSuccess={() => {
                  refetchLoans()
                }}
              />
            )}

            {isRequestToolsModalOpen && (
              <RequestToolsModal
                isOpen={isRequestToolsModalOpen}
                onClose={() => setIsRequestToolsModalOpen(false)}
                onSuccess={() => {
                  refetchLoans()
                }}
              />
            )}

            {isReturnToolsModalOpen && (
              <ReturnToolsModal
                isOpen={isReturnToolsModalOpen}
                onClose={() => setIsReturnToolsModalOpen(false)}
                onSuccess={() => {
                  refetchLoans()
                }}
              />
            )}
          </Suspense>
        </div>
        </div>
      </SwipeContainer>
    </ProtectedRoute>
  )
}
