'use client';

/**
 * Access Denied Page
 * 
 * This page is displayed when a user tries to access a section
 * they don't have permission to view.
 * 
 * @see Requirements 4.2 - Redirect to access denied page if no permission
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleGoToLogin = () => {
    router.push('/login');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-claro-red" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark mb-4">
          Acceso Denegado
        </h1>
        
        {/* Message */}
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8">
          No tienes permiso para acceder a esta sección del sistema.
          {user && (
            <span className="block mt-2 text-sm">
              Si crees que deberías tener acceso, contacta a un administrador.
            </span>
          )}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Volver Atrás
          </button>
          
          {user ? (
            <button
              onClick={handleGoToDashboard}
              className="px-6 py-3 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Ir al Dashboard
            </button>
          ) : (
            <button
              onClick={handleGoToLogin}
              className="px-6 py-3 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
        
        {/* Additional Info */}
        <div className="mt-12 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <strong>Código de error:</strong> 403 - Forbidden
          </p>
          {user && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              <strong>Usuario:</strong> {user.username} ({user.role})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
