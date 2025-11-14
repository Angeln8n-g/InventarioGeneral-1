import { NextRequest, NextResponse } from 'next/server'
import { 
  notificationOperations,
  consumableStockOperations,
  auditLogOperations 
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.NOTIFICATIONS_SEND, async (authContext) => {
      const body = await request.json()
      const { action, message, title, user_ids } = body

      if (action === 'send_system_notification') {
        if (!message || !title) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Title and message are required',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        const notifications: Array<{ user_id: number; type: string; title: string; message: string }> = []
        const targetUserIds = user_ids || [] // If no user_ids provided, could send to all users

        // If no specific users provided, this could be enhanced to send to all users
        if (targetUserIds.length === 0) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'user_ids array is required for system notifications',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        // Send notification to each specified user
        for (const userId of targetUserIds) {
          try {
            const notification = await notificationOperations.create({
              user_id: userId,
              type: 'system_announcement',
              title,
              message,
            })
            notifications.push(notification)
          } catch (notificationError) {
            console.error(`Failed to create notification for user ${userId}:`, notificationError)
          }
        }

        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'system_notification_sent',
            entity_type: 'notification',
            entity_id: 0,
            new_values: {
              title,
              message,
              target_users: targetUserIds.length,
              notifications_created: notifications.length,
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }

        return NextResponse.json({
          message: 'System notification sent successfully',
          data: {
            notifications_sent: notifications.length,
            failed_notifications: targetUserIds.length - notifications.length,
            target_users: targetUserIds.length,
          },
        })

      } else if (action === 'check_low_stock_alerts') {
        // Check for low stock items and send alerts
        const allStocks = await consumableStockOperations.getAll()
        const lowStockItems = allStocks.filter(stock => 
          stock.current_quantity <= stock.minimum_threshold
        )

        const notifications: Array<{ user_id: number; type: string; title: string; message: string }> = []

        // Send low stock alerts to admins (this could be enhanced to have a configurable list)
        if (lowStockItems.length > 0) {
          const alertMessage = `${lowStockItems.length} items are running low on stock: ${
            lowStockItems.slice(0, 3).map(item => item.item_type?.name).join(', ')
          }${lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ''}.`

          // For now, send to the requesting admin user
          try {
            const notification = await notificationOperations.create({
              user_id: authContext.user.id,
              type: 'stock_alert',
              title: 'Low Stock Alert',
              message: alertMessage,
            })
            notifications.push(notification)
          } catch (notificationError) {
            console.error('Failed to create low stock notification:', notificationError)
          }
        }

        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'stock_alert_check',
            entity_type: 'system',
            entity_id: 0,
            new_values: {
              low_stock_items: lowStockItems.length,
              notifications_sent: notifications.length,
              items_checked: allStocks.length,
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }

        return NextResponse.json({
          message: 'Stock alert check completed',
          data: {
            low_stock_items: lowStockItems.length,
            notifications_sent: notifications.length,
            low_stock_details: lowStockItems.map(item => ({
              id: item.id,
              name: item.item_type?.name,
              current_quantity: item.current_quantity,
              minimum_threshold: item.minimum_threshold,
            })),
          },
        })

      } else if (action === 'send_maintenance_notification') {
        const { maintenance_message, scheduled_time } = body

        if (!maintenance_message) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'maintenance_message is required',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        const notifications: Array<{ user_id: number; type: string; title: string; message: string }> = []
        const targetUserIds = user_ids || []

        if (targetUserIds.length === 0) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'user_ids array is required for maintenance notifications',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        const maintenanceTitle = scheduled_time 
          ? `Scheduled Maintenance - ${new Date(scheduled_time).toLocaleString()}`
          : 'System Maintenance Notice'

        // Send maintenance notification to each specified user
        for (const userId of targetUserIds) {
          try {
            const notification = await notificationOperations.create({
              user_id: userId,
              type: 'system_maintenance',
              title: maintenanceTitle,
              message: maintenance_message,
            })
            notifications.push(notification)
          } catch (notificationError) {
            console.error(`Failed to create maintenance notification for user ${userId}:`, notificationError)
          }
        }

        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'maintenance_notification_sent',
            entity_type: 'notification',
            entity_id: 0,
            new_values: {
              maintenance_message,
              scheduled_time,
              target_users: targetUserIds.length,
              notifications_created: notifications.length,
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }

        return NextResponse.json({
          message: 'Maintenance notification sent successfully',
          data: {
            notifications_sent: notifications.length,
            failed_notifications: targetUserIds.length - notifications.length,
            target_users: targetUserIds.length,
          },
        })

      } else {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid action. Supported actions: send_system_notification, check_low_stock_alerts, send_maintenance_notification',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('System notification error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}