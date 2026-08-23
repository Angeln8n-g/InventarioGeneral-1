'use client'

import React, { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useGetMyLoansQuery, useGetMyConsumptionsQuery, useGetAllActiveLoansQuery, useGetAvailableToolsQuery } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { ActiveLoansFilterModal } from '@/components/loans/ActiveLoansFilterModal'
import { AvailableToolsFilterModal } from '@/components/tools/AvailableToolsFilterModal'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

// Shared loading spinner component
const ModalSpinner = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
  </div>
)

// Lazy load modals with shared spinner - Simplified for Turbopack
const ReturnToolsModal = dynamic(() => import('@/components/dashboard/ReturnToolsModal').then(mod => ({ default: mod.ReturnToolsModal })), {
  loading: ModalSpinner,
  ssr: false
})

interface Loan {
  id: number
  due_date: string
  status: string
  tool_instance?: {
    item_type?: {
      name: string
      description?: string | undefined
    } | undefined
    serial_number?: string | undefined
  } | undefined
  loan_date: string
  return_date?: string | undefined
  notes?: string | undefined
  user?: {
    full_name?: string | undefined
    username?: string | undefined
  } | undefined
}



interface LoanItemProps {
  loan: Loan
}

const LoanItem = React.memo<LoanItemProps>(({ loan }) => {
  const { t } = useLanguage()
  const isOverdue = new Date(loan.due_date) < new Date() && loan.status === 'active'

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-claro-blue/10 dark:bg-claro-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-claro-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-text-light dark:text-text-dark">
              {loan.tool_instance?.item_type?.name || t('loan.unknownTool')}
            </h3>
          </div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
            {loan.tool_instance?.serial_number
              ? `${t('loan.serial')}: ${loan.tool_instance.serial_number}`
              : loan.tool_instance?.item_type?.description || 'No description available'
            }
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                {t('loan.loaned')}: {new Date(loan.loan_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`${isOverdue ? 'text-claro-red font-medium' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                {t('loan.due')}: {new Date(loan.due_date).toLocaleDateString()}
              </span>
            </div>
            {loan.return_date && (
              <div className="flex items-center gap-1 col-span-2">
                <svg className="w-3 h-3 text-claro-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-claro-green">
                  {t('loan.returned')}: {new Date(loan.return_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {loan.notes && (
            <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">{t('loan.notes')}: </span>
              <span className="text-text-light dark:text-text-dark">{loan.notes}</span>
            </div>
          )}
        </div>

        <div className="ml-4 flex flex-col items-end">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${loan.status === 'returned' ? 'bg-claro-green/10 dark:bg-claro-green/20 text-claro-green' :
            loan.status === 'lost' ? 'bg-claro-red/10 dark:bg-claro-red/20 text-claro-red' :
              isOverdue ? 'bg-claro-red/10 dark:bg-claro-red/20 text-claro-red' :
                'bg-claro-warning/10 dark:bg-claro-warning/20 text-claro-warning'
            }`}>
            {loan.status === 'returned' ? t('myLoans.returned') :
              loan.status === 'lost' ? t('loan.lost') :
                isOverdue ? t('loan.overdue') : t('myLoans.active')}
          </span>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Solo re-renderizar si el loan cambia
  return (
    prevProps.loan.id === nextProps.loan.id &&
    prevProps.loan.status === nextProps.loan.status &&
    prevProps.loan.return_date === nextProps.loan.return_date
  )
})

LoanItem.displayName = 'LoanItem'

export default function MyLoansPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { data: loansData, isLoading, refetch: refetchLoans } = useGetMyLoansQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
    refetchOnMountOrArgChange: 300, // Cache for 5 minutes
  })
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'consumables'>('active')
  const [isReturnToolsModalOpen, setIsReturnToolsModalOpen] = useState(false)
  const [isActiveLoansFilterModalOpen, setIsActiveLoansFilterModalOpen] = useState(false)
  const [isAvailableToolsFilterModalOpen, setIsAvailableToolsFilterModalOpen] = useState(false)

  // RTK Query hook for consumptions
  const { data: consumptionsData, isLoading: isLoadingConsumptions } = useGetMyConsumptionsQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
    refetchOnMountOrArgChange: 300, // Cache for 5 minutes
  })

  // RTK Query hooks for new tabs
  const { data: allActiveLoansData, isLoading: isLoadingAllActive } = useGetAllActiveLoansQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
    refetchOnMountOrArgChange: 300, // Cache for 5 minutes
  })
  const { data: availableToolsData, isLoading: isLoadingAvailable } = useGetAvailableToolsQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
    refetchOnMountOrArgChange: 300, // Cache for 5 minutes
  })





  // Memoized data transformations
  const loansResponse = useMemo(
    () => loansData?.data as unknown as { active?: Loan[]; overdue?: Loan[]; returned?: Loan[]; lost?: Loan[]; total?: number } | undefined,
    [loansData]
  )

  const { activeLoans, overdueLoans, returnedLoans, lostLoans, allActiveLoans, historyLoans } = useMemo(() => {
    const active = loansResponse?.active || []
    const overdue = loansResponse?.overdue || []
    const returned = loansResponse?.returned || []
    const lost = loansResponse?.lost || []

    return {
      activeLoans: active,
      overdueLoans: overdue,
      returnedLoans: returned,
      lostLoans: lost,
      allActiveLoans: [...active, ...overdue],
      historyLoans: [...returned, ...lost]
    }
  }, [loansResponse])

  const consumptions = useMemo(() => consumptionsData?.data || [], [consumptionsData])
  const allSystemActiveLoans = useMemo(() => allActiveLoansData?.data || [], [allActiveLoansData])
  const availableTools = useMemo(() => availableToolsData?.data || [], [availableToolsData])

  // Memoized handlers
  const handleCloseReturnModal = useCallback(() => {
    setIsReturnToolsModalOpen(false)
    refetchLoans()
  }, [refetchLoans])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title={t('myLoans.title')}>
          <div className="px-4 py-6">
            {/* Skeleton loader */}
            <div className="space-y-6 animate-pulse">
              {/* Summary skeleton */}
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-24" />
                ))}
              </div>
              {/* Tabs skeleton */}
              <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-10 w-32" />
                ))}
              </div>
              {/* Content skeleton */}
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-32" />
                ))}
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout title={t('myLoans.title')}>
        {/* Background optimizado con Next.js Image */}
        <div className="fixed inset-0 -z-20 top-16">
          <Image
            src="/images/solicitar-materiales-background.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={75}
            sizes="100vw"
          />
        </div>

        {/* Overlay para mejorar legibilidad */}
        <div className="fixed inset-0 -z-10 top-16 bg-white/50 dark:bg-gray-900/50" />

        <SwipeContainer enabled={true}>
          {/* Contenido con padding inferior extra para la barra de navegación */}
          <div className="relative z-0 px-4 py-6 min-h-[calc(100vh-8rem)] pb-32">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4"></h1>

              {/* Alert for return requirement */}
              {allActiveLoans.length > 0 && (
                <div className="bg-claro-blue/10 dark:bg-claro-blue/20 border border-claro-blue/30 rounded-lg p-4 flex items-start space-x-3">
                  <svg className="w-5 h-5 text-claro-blue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-text-light dark:text-text-dark font-medium">
                      {t('myLoans.scanRequiredTitle') || 'Escaneo obligatorio para devoluciones'}
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {t('myLoans.scanRequiredDesc') || 'Para devolver una herramienta, debes escanear su código QR. Usa el botón de abajo para iniciar el escáner.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards - Estilo mejorado */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('myLoans.active')}</div>
                    <div className="text-3xl font-bold text-claro-blue">{allActiveLoans.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-claro-blue/10 dark:bg-claro-blue/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-claro-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('myLoans.overdue')}</div>
                    <div className="text-3xl font-bold text-claro-red">{overdueLoans.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-claro-red/10 dark:bg-claro-red/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-claro-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('myLoans.returned')}</div>
                    <div className="text-3xl font-bold text-claro-green">{returnedLoans.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-claro-green/10 dark:bg-claro-green/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-claro-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">{t('myLoans.total')}</div>
                    <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{(loansResponse as { total?: number })?.total || 0}</div>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs y Acciones Rápidas */}
            <div className="space-y-4 mb-6">
              {/* Main Tabs */}
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-text-light dark:text-text-dark">Gestión de Préstamos</h2>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Administra tus préstamos y consulta el inventario
                  </p>
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'active'
                      ? 'bg-claro-red text-white shadow-md'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    {t('myLoans.myLoans') || 'Mis Préstamos'} ({allActiveLoans.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'history'
                      ? 'bg-claro-red text-white shadow-md'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    {t('myLoans.history')} ({historyLoans.length})
                  </button>
                </div>
              </div>

              {/* Quick Actions - Estilo consistente con consumables */}
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-text-light dark:text-text-dark">Acciones Rápidas</h2>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Consulta préstamos y herramientas disponibles
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsActiveLoansFilterModalOpen(true)}
                    className="flex items-center p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Préstamos Activos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ver todos los préstamos ({allSystemActiveLoans.length})</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsAvailableToolsFilterModalOpen(true)}
                    className="flex items-center p-4 rounded-lg border-2 border-green-200 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Herramientas Disponibles</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ver inventario disponible ({availableTools.length})</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Loan Lists */}
            {activeTab === 'active' && allActiveLoans.length > 0 && (
              <div className="space-y-4">
                {allActiveLoans.map((loan) => (
                  <LoanItem key={loan.id} loan={loan} />
                ))}

                {/* Scan to Return Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setIsReturnToolsModalOpen(true)}
                    className="w-full bg-claro-red hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    {t('myLoans.scanToReturn')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {historyLoans.length > 0 ? (
                  historyLoans.map((loan) => (
                    <LoanItem key={loan.id} loan={loan} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
                    <svg className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-semibold mb-2 text-text-light dark:text-text-dark">{t('myLoans.noHistory')}</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('myLoans.noHistoryDesc')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Consumables Tab */}
            {activeTab === 'consumables' && (
              <div className="space-y-4">
                {isLoadingConsumptions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">{t('common.loadingConsumptions')}</p>
                  </div>
                ) : consumptions.length > 0 ? (
                  consumptions.map((consumptionDate) => {
                    return (
                      <div
                        key={consumptionDate.consumption_date}
                        className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                      >
                        {/* Date Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                          <div>
                            <h3 className="font-semibold text-text-light dark:text-text-dark">
                              {new Date(consumptionDate.consumption_date).toLocaleDateString()}
                            </h3>
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {consumptionDate.total_items} items • {consumptionDate.total_consumed} unidades consumidas
                            </p>
                          </div>
                          {consumptionDate.total_returnable > 0 && (
                            <span className="text-xs bg-claro-blue/10 dark:bg-claro-blue/20 text-claro-blue px-2 py-1 rounded">
                              {consumptionDate.total_returnable} retornables
                            </span>
                          )}
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                          {consumptionDate.items.map((item) => {
                            return (
                              <div
                                key={item.item_type_id}
                                className="flex items-start justify-between"
                              >
                                <div className="flex-1">
                                  <h4 className="font-medium text-text-light dark:text-text-dark text-sm">
                                    {item.item_name}
                                  </h4>
                                  {item.item_description && (
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                      {item.item_description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs">
                                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                                      Consumido: <span className="font-medium text-text-light dark:text-text-dark">
                                        {item.consumed_quantity} {item.unit_of_measure}
                                      </span>
                                    </span>
                                    {item.returned_quantity > 0 && (
                                      <span className="text-claro-green">
                                        Devuelto: {item.returned_quantity} {item.unit_of_measure}
                                      </span>
                                    )}
                                    {item.returnable_quantity > 0 && (
                                      <span className="text-claro-blue">
                                        Retornable: {item.returnable_quantity} {item.unit_of_measure}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="w-10 h-10 bg-claro-green/10 dark:bg-claro-green/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-claro-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
                    <svg className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2 text-text-light dark:text-text-dark">{t('myLoans.noConsumables')}</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">{t('myLoans.noConsumablesDesc')}</p>
                    <Button onClick={() => router.push('/consumables/scan')}>
                      {t('myLoans.scanToConsume')}
                    </Button>
                  </div>
                )}
              </div>
            )}

          </div>
        </SwipeContainer>

        {/* Modals - Only render when open for better performance */}
        {isReturnToolsModalOpen && (
          <ReturnToolsModal
            isOpen={isReturnToolsModalOpen}
            onClose={handleCloseReturnModal}
            onSuccess={refetchLoans}
          />
        )}

        {isActiveLoansFilterModalOpen && (
          <ActiveLoansFilterModal
            isOpen={isActiveLoansFilterModalOpen}
            onClose={() => setIsActiveLoansFilterModalOpen(false)}
            loans={allSystemActiveLoans}
          />
        )}

        {isAvailableToolsFilterModalOpen && (
          <AvailableToolsFilterModal
            isOpen={isAvailableToolsFilterModalOpen}
            onClose={() => setIsAvailableToolsFilterModalOpen(false)}
            tools={availableTools}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}
