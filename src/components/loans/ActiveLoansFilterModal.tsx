import React, { useState, useMemo } from 'react'
import { Search, User, Calendar, Package } from 'lucide-react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface Loan {
  id: number
  due_date: string
  status: string
  tool_instance?: {
    item_type?: {
      name: string
      description?: string | null
    } | null
    serial_number?: string | null
  } | null
  loan_date: string
  return_date?: string | null
  notes?: string | null
  user?: {
    id: number
    username: string
    email: string
    full_name?: string | null
  } | null
}

interface ActiveLoansFilterModalProps {
  isOpen: boolean
  onClose: () => void
  loans: Loan[]
}

export const ActiveLoansFilterModal: React.FC<ActiveLoansFilterModalProps> = ({
  isOpen,
  onClose,
  loans,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all')

  // Get unique users from loans
  const users = useMemo(() => {
    const userMap = new Map<number, { id: number; username: string; email: string; loanCount: number }>()

    loans.forEach((loan) => {
      if (loan.user) {
        const existing = userMap.get(loan.user.id)
        if (existing) {
          existing.loanCount++
        } else {
          userMap.set(loan.user.id, {
            id: loan.user.id,
            username: loan.user.username,
            email: loan.user.email,
            loanCount: 1,
          })
        }
      }
    })

    return Array.from(userMap.values()).sort((a, b) => b.loanCount - a.loanCount)
  }, [loans])

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Filter by user
      const userMatch = selectedUserId === 'all' || loan.user?.id === selectedUserId

      // Filter by search term
      const searchLower = searchTerm.toLowerCase()
      const searchMatch = !searchTerm || (
        loan.tool_instance?.item_type?.name?.toLowerCase().includes(searchLower) ||
        loan.tool_instance?.serial_number?.toLowerCase().includes(searchLower) ||
        loan.user?.username?.toLowerCase().includes(searchLower) ||
        loan.user?.email?.toLowerCase().includes(searchLower)
      )

      return userMatch && searchMatch
    })
  }, [loans, selectedUserId, searchTerm])

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="auto"
      speed="fast"
      enableHaptics={true}
      className="!max-w-5xl !max-h-[95vh] sm:!max-h-[90vh] flex flex-col"
      title="Préstamos Activos"
      description={`${filteredLoans.length} ${filteredLoans.length === 1 ? 'préstamo' : 'préstamos'}${selectedUserId !== 'all' ? ` de ${users.find(u => u.id === selectedUserId)?.username}` : ''}${loans.length !== filteredLoans.length ? ` de ${loans.length} totales` : ''}`}
    >

        {/* Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pl-9 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Usuario:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedUserId('all')}
                className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 ${selectedUserId === 'all'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="font-semibold text-xs sm:text-sm">Todos</div>
                <span className="text-[10px] sm:text-xs opacity-80">({loans.length})</span>
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 ${selectedUserId === user.id
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="font-semibold text-xs sm:text-sm truncate">{user.username}</div>
                  <span className="text-[10px] sm:text-xs opacity-80">({user.loanCount})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || selectedUserId !== 'all') && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                Mostrando {filteredLoans.length} de {loans.length} préstamos
              </span>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedUserId('all')
                }}
                className="text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                {searchTerm || selectedUserId !== 'all'
                  ? 'No se encontraron préstamos'
                  : 'No hay préstamos activos'}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3 sm:mb-4">
                {searchTerm || selectedUserId !== 'all'
                  ? 'Intenta con otros filtros o términos de búsqueda'
                  : 'No hay préstamos activos en este momento'}
              </p>
              {(searchTerm || selectedUserId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedUserId('all')
                  }}
                  className="claro-button-secondary px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {filteredLoans.map((loan) => {
                const overdue = isOverdue(loan.due_date)

                return (
                  <div
                    key={loan.id}
                    className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border ${overdue
                      ? 'border-claro-red'
                      : 'border-gray-200 dark:border-gray-700'
                      } hover:shadow-md transition-all`}
                  >
                    {/* User Info */}
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
                            {loan.user?.username || 'Unknown User'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                            {loan.user?.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ml-2 ${overdue
                          ? 'bg-claro-red/10 text-claro-red'
                          : 'bg-claro-warning/10 text-claro-warning'
                          }`}
                      >
                        {overdue ? 'Vencido' : 'Activo'}
                      </span>
                    </div>

                    {/* Tool Info */}
                    <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-text-light dark:text-text-dark text-xs sm:text-sm mb-1">
                        {loan.tool_instance?.item_type?.name || 'Unknown Tool'}
                      </h4>
                      {loan.tool_instance?.serial_number && (
                        <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          Serial: {loan.tool_instance.serial_number}
                        </p>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                          Prestado:
                        </span>
                        <span className="font-medium text-text-light dark:text-text-dark">
                          {new Date(loan.loan_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark flex items-center">
                          <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                          Vencimiento:
                        </span>
                        <span className={`font-medium ${overdue ? 'text-claro-red' : 'text-text-light dark:text-text-dark'}`}>
                          {new Date(loan.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {loan.notes && (
                      <div className="mt-2 sm:mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-[10px] sm:text-xs">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">Nota: </span>
                        <span className="text-text-light dark:text-text-dark">{loan.notes}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark text-center sm:text-left">
              💡 Filtra por usuario para ver sus préstamos
            </p>
            <button
              onClick={onClose}
              className="claro-button-secondary px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
            >
              Cerrar
            </button>
          </div>
        </div>
    </TransitionDialog>
  )
}
