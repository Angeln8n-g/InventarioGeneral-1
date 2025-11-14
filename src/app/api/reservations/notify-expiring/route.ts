import { NextRequest, NextResponse } from 'next/server'
import { reservationOperations, notificationOperations } from '@/lib/supabase-client'

// POST /api/reservations/notify-expiring - Send notifications for expiring reservations
// This endpoint can be called by a cron job
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.CRON_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
        { status: 401 }
      )
    }

    console.log('🔔 Running expiring reservations notification job...')
    
    // Get all active reservations
    const activeReservations = await reservationOperations.getAll({ status: 'active' })
    
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    let notificationsSent = 0
    const errors: string[] = []

    // Find reservations expiring soon
    for (const reservation of activeReservations) {
      const expirationDate = new Date(reservation.expiration_date)
      const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let shouldNotify = false
      let notificationType: 'urgent' | 'warning' | 'reminder' = 'reminder'
      let title = ''
      let message = ''

      // Expiring in less than 24 hours (urgent)
      if (expirationDate <= tomorrow && hoursUntilExpiration > 0) {
        shouldNotify = true
        notificationType = 'urgent'
        title = '⚠️ Reserva Expira Pronto'
        message = `Tu reserva de "${reservation.item_name}" expira en ${Math.ceil(hoursUntilExpiration)} horas. Por favor recógela pronto o se cancelará automáticamente.`
      }
      // Expiring in 3 days (warning)
      else if (expirationDate <= in3Days && expirationDate > tomorrow) {
        shouldNotify = true
        notificationType = 'warning'
        title = '📅 Recordatorio de Reserva'
        message = `Tu reserva de "${reservation.item_name}" expira el ${expirationDate.toLocaleDateString('es-ES')}. Recuerda recogerla a tiempo.`
      }

      if (shouldNotify) {
        try {
          // Check if notification was already sent today
          const existingNotificationsResult = await notificationOperations.getByUserId(
            reservation.user_id,
            { type: 'reservation_expiring' }
          )
          
          const existingNotifications = existingNotificationsResult.data || []
          
          const alreadyNotifiedToday = existingNotifications.some((n: any) => {
            const notifDate = new Date(n.created_at)
            return (
              n.message.includes(reservation.item_name) &&
              notifDate.toDateString() === now.toDateString()
            )
          })

          if (!alreadyNotifiedToday) {
            await notificationOperations.create({
              user_id: reservation.user_id,
              type: 'reservation_expiring',
              title,
              message,
            })
            notificationsSent++
            console.log(`✅ Notification sent to user ${reservation.username} for reservation #${reservation.id}`)
          }
        } catch (error) {
          console.error(`❌ Failed to send notification for reservation #${reservation.id}:`, error)
          errors.push(`Reservation #${reservation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    console.log(`✅ Notification job completed. Sent: ${notificationsSent}, Errors: ${errors.length}`)

    return NextResponse.json({
      success: true,
      message: 'Notification job completed',
      stats: {
        total_active_reservations: activeReservations.length,
        notifications_sent: notificationsSent,
        errors: errors.length,
        timestamp: new Date().toISOString(),
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: unknown) {
    console.error('❌ Notification job error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send notifications',
        },
      },
      { status: 500 }
    )
  }
}

// GET /api/reservations/notify-expiring - Check notification status
export async function GET(request: NextRequest) {
  try {
    const activeReservations = await reservationOperations.getAll({ status: 'active' })
    
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    const stats = {
      total_active: activeReservations.length,
      expiring_in_24h: activeReservations.filter(r => 
        new Date(r.expiration_date) <= tomorrow
      ).length,
      expiring_in_3days: activeReservations.filter(r => 
        new Date(r.expiration_date) <= in3Days && new Date(r.expiration_date) > tomorrow
      ).length,
      timestamp: now.toISOString(),
    }

    return NextResponse.json({ stats })
  } catch (error: unknown) {
    console.error('Get notification status error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get notification status',
        },
      },
      { status: 500 }
    )
  }
}
