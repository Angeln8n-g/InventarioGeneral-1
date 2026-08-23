/**
 * Lazy Loading Components
 * 
 * Este archivo centraliza todos los componentes que se cargan de forma lazy
 * para reducir el bundle inicial y mejorar el tiempo de carga.
 */

import { lazy, ComponentType, Suspense, ReactNode } from 'react'


// Componente de loading genérico
export const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
            </div>
  )
}

// ============================================================================
// ADMIN COMPONENTS (Solo para admins - no necesarios en bundle inicial)
// ============================================================================

export const BulkImportConsumables = lazy(() =>
    import('@/components/admin/BulkImportConsumables').then(m => ({ default: m.BulkImportConsumables }))
)

// ============================================================================
// REPORTS COMPONENTS (Pesados por recharts - lazy load)
// ============================================================================

export const ReportCharts = lazy(() =>
    import('@/components/reports/ReportCharts')
)

export const ReportTable = lazy(() =>
    import('@/components/reports/ReportTable')
)

export const ExportButton = lazy(() =>
    import('@/components/reports/ExportButton')
)

// ============================================================================
// SCANNER COMPONENTS (html5-qrcode es pesado)
// ============================================================================

export const QRScanner = lazy(() =>
    import('@/components/shared/QRScanner').then(m => ({ default: m.QRScanner }))
)

export const ReturnScanner = lazy(() =>
    import('@/components/returns/ReturnScanner').then(m => ({ default: m.ReturnScanner }))
)

// ============================================================================
// MODALS (No necesarios hasta que se abren)
// ============================================================================

export const LoanDetailsModal = lazy(() =>
    import('@/components/dashboard/LoanDetailsModal').then(m => ({ default: m.LoanDetailsModal }))
)

export const RequestMaterialsModal = lazy(() =>
    import('@/components/dashboard/RequestMaterialsModal').then(m => ({ default: m.RequestMaterialsModal }))
)

export const RequestToolsModal = lazy(() =>
    import('@/components/dashboard/RequestToolsModal').then(m => ({ default: m.RequestToolsModal }))
)

export const ReturnMaterialsModal = lazy(() =>
    import('@/components/dashboard/ReturnMaterialsModal').then(m => ({ default: m.ReturnMaterialsModal }))
)

export const ReturnToolsModal = lazy(() =>
    import('@/components/dashboard/ReturnToolsModal').then(m => ({ default: m.ReturnToolsModal }))
)

export const ConsumableDetailsModal = lazy(() =>
    import('@/components/consumables/ConsumableDetailsModal').then(m => ({ default: m.ConsumableDetailsModal }))
)

export const ToolDetailsModal = lazy(() =>
    import('@/components/tools/ToolDetailsModal').then(m => ({ default: m.ToolDetailsModal }))
)

export const LoanConfirmationModal = lazy(() =>
    import('@/components/bag/LoanConfirmationModal').then(m => ({ default: m.LoanConfirmationModal }))
)

export const BagModal = lazy(() =>
    import('@/components/bag/BagModal').then(m => ({ default: m.BagModal }))
)

export const CartModal = lazy(() =>
    import('@/components/cart/CartModal').then(m => ({ default: m.CartModal }))
)

export const VaultModal = lazy(() =>
    import('@/components/vault/VaultModal').then(m => ({ default: m.VaultModal }))
)

export const ReturnCartModal = lazy(() =>
    import('@/components/returns/ReturnCartModal').then(m => ({ default: m.ReturnCartModal }))
)

export const QuantityModal = lazy(() =>
    import('@/components/scanner/QuantityModal').then(m => ({ default: m.QuantityModal }))
)

// ============================================================================
// NOTIFICATION PREFERENCES (Usado ocasionalmente)
// ============================================================================

export const NotificationPreferences = lazy(() =>
    import('@/components/notifications/NotificationPreferences').then(m => ({ default: m.NotificationPreferences }))
)

// ============================================================================
// CONSUMABLES COMPONENTS (Pesados, solo para página específica)
// ============================================================================

export const BackordersTab = lazy(() =>
    import('@/components/consumables/BackordersTab').then(m => ({ default: m.BackordersTab }))
)

export const StockAdjustmentForm = lazy(() =>
    import('@/components/consumables/StockAdjustmentForm').then(m => ({ default: m.StockAdjustmentForm }))
)

// ============================================================================
// HELPER: Wrapper con Suspense
// ============================================================================

interface LazyWrapperProps {
    children: ReactNode
    fallback?: ReactNode
}

export const LazyWrapper = ({ children, fallback }: LazyWrapperProps) => {
    return (
        <Suspense fallback={fallback || <LoadingSpinner />}>
    { children }
    </Suspense>
        )
}

// ============================================================================
// HELPER: HOC para lazy loading
// ============================================================================

export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  const LazyWrapper = (props: P) => {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    )
  }
  LazyWrapper.displayName = `WithLazyLoading(${Component.displayName || Component.name || 'Component'})`
  return LazyWrapper
}
