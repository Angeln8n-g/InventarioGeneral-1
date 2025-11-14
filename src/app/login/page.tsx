'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { RootState } from '@/app/store'
import { useLoginMutation } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OptimizedBackgroundImage } from '@/components/ui/OptimizedBackgroundImage'
import { BACKGROUND_IMAGES } from '@/types/images'

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

type FormData = yup.InferType<typeof schema>

export default function LoginPage() {
  const { user, token } = useSelector((state: RootState) => state.auth)
  const [login, { isLoading, error }] = useLoginMutation()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }, [token, user, router])

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data).unwrap()
      console.log('Login successful:', result)
      // Redirect will be handled by useEffect when user state changes
    } catch (err) {
      // RTK Query errors are already handled by the error state from the mutation
      // Log the error for debugging purposes
      if (err && typeof err === 'object') {
        if ('data' in err) {
          console.error('Login failed:', err.data)
        } else if ('message' in err) {
          console.error('Login failed:', err.message)
        } else {
          console.error('Login failed:', err)
        }
      } else {
        console.error('Login failed:', err)
      }
    }
  }

  return (
    <OptimizedBackgroundImage
      src={BACKGROUND_IMAGES.login.src}
      alt={BACKGROUND_IMAGES.login.alt}
      priority={BACKGROUND_IMAGES.login.priority}
      quality={BACKGROUND_IMAGES.login.quality}
      overlayOpacity={BACKGROUND_IMAGES.login.overlayOpacity}
      darkOverlayOpacity={BACKGROUND_IMAGES.login.darkOverlayOpacity}
      className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full">
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-primary">
              🗃️ Inventario SGI 🛠️
            </h1>
            <h2 className="text-3xl font-bold mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Sistema de Gestión de Inventario
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                {...register('username')}
                label="Username"
                type="text"
                autoComplete="username"
                error={errors.username?.message}
                placeholder="Enter your username"
              />
              <Input
                {...register('password')}
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-accent p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-accent mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-accent">
                    {(() => {
                      if (error && typeof error === 'object') {
                        if ('data' in error && error.data && typeof error.data === 'object') {
                          if ('error' in error.data && error.data.error && typeof error.data.error === 'object' && 'message' in error.data.error) {
                            return String(error.data.error.message)
                          }
                          if ('message' in error.data) {
                            return String(error.data.message)
                          }
                        }
                        if ('message' in error) {
                          return String(error.message)
                        }
                        if ('status' in error) {
                          return `Error: ${error.status}`
                        }
                      }
                      return 'Invalid username or password. Please try again.'
                    })()}
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-primary text-white hover:bg-purple-700"
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </OptimizedBackgroundImage>
  )
}