import React from 'react'
import { Header } from './Header'
import MobileNavigation from './MobileNavigation'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  showNavigation?: boolean
  showNotifications?: boolean
  className?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  showNavigation = true,
  showNotifications = true,
  className = '',
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header 
        title={title} 
        showNotifications={showNotifications}
      />
      
      {/* Main Content - Con padding superior para header y inferior para navegación */}
      <main className={`flex-1 pt-16 ${showNavigation ? 'pb-24' : 'pb-4'} ${className}`}>
        {children}
      </main>
      
      {/* Mobile Navigation */}
      {showNavigation && <MobileNavigation />}
    </div>
  )
}

export default AppLayout