'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.passwordsDoNotMatch'))
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError(t('changePassword.passwordTooShort'))
      return
    }

    // Validate passwords are different
    if (currentPassword === newPassword) {
      setError(t('changePassword.samePassword'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || t('changePassword.failed'))
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Redirect to profile after 2 seconds
      setTimeout(() => {
        router.push('/profile')
      }, 2000)

    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : t('changePassword.unknownError')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout title={t('changePassword.title')}>
        <div className="px-4 py-6 max-w-md mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{t('changePassword.title')}</h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {t('changePassword.description')}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-accent rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-accent mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-accent mb-1">{t('common.success')}</h3>
                  <p className="text-sm text-text-light dark:text-text-dark">{t('changePassword.success')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-accent rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-accent mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-accent mb-1">{t('common.error')}</h3>
                  <p className="text-sm text-text-light dark:text-text-dark">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleSubmit} className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('changePassword.currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={t('changePassword.enterCurrentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('changePassword.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={t('changePassword.enterNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  {t('changePassword.passwordRequirements')}
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  {t('changePassword.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={t('changePassword.confirmNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex space-x-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? t('changePassword.changing') : t('changePassword.changePassword')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/profile')}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
