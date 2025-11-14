import { useState, useEffect } from 'react'
import type { ReservationDetails } from '@/types/database'

export function useReservations() {
  const [reservations, setReservations] = useState<ReservationDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reservations?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const getReservationsForItem = (itemTypeId: number) => {
    return reservations.filter(r => r.item_type_id === itemTypeId)
  }

  const getTotalReservedForItem = (itemTypeId: number) => {
    return reservations
      .filter(r => r.item_type_id === itemTypeId)
      .reduce((sum, r) => sum + r.reserved_quantity, 0)
  }

  return {
    reservations,
    isLoading,
    getReservationsForItem,
    getTotalReservedForItem,
    refetch: fetchReservations,
  }
}
