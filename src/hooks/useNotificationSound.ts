import { useEffect, useRef } from 'react'
import { useGetNotificationPreferencesQuery } from '@/services/api'

export const useNotificationSound = () => {
  const { data: preferencesData } = useGetNotificationPreferencesQuery()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previousCountRef = useRef<number>(0)

  useEffect(() => {
    // Create audio element
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.5
    }
  }, [])

  const playSound = () => {
    const soundEnabled = preferencesData?.data?.sound_enabled
    
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.warn('Failed to play notification sound:', error)
      })
    }
  }

  const checkForNewNotifications = (currentCount: number) => {
    if (currentCount > previousCountRef.current && previousCountRef.current > 0) {
      playSound()
    }
    previousCountRef.current = currentCount
  }

  return {
    playSound,
    checkForNewNotifications,
  }
}
