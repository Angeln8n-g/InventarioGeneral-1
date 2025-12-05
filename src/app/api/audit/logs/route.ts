import { NextRequest, NextResponse } from 'next/server'
import { auditLogOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // Only admins can access audit logs
      if (authContext.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 403 }
        )
      }

      const { searchParams } = new URL(request.url)
      
      const filters = {
        user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id')!) : undefined,
        entity_type: searchParams.get('entity_type') || undefined,
        action: searchParams.get('action') || undefined,
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
      }

      const logs = await auditLogOperations.getAll(filters)

      // Generate summary statistics
      const summary = {
        total: logs.length,
        by_action: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        by_entity_type: logs.reduce((acc, log) => {
          acc[log.entity_type] = (acc[log.entity_type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        by_user: logs.reduce((acc, log) => {
          const username = log.user?.username || 'System'
          acc[username] = (acc[username] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      }

      return NextResponse.json({
        success: true,
        data: logs,
        summary,
      })
    })
  } catch (error) {
    console.error('Audit logs fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
