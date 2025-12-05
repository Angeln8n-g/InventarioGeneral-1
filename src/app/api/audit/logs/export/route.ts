import { NextRequest, NextResponse } from 'next/server'
import { auditLogOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // Only admins can export audit logs
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

      // Generate CSV
      const headers = [
        'ID',
        'User',
        'Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'IP Address',
        'User Agent',
        'Created At',
      ]

      const rows = logs.map(log => [
        log.id,
        log.user?.username || 'System',
        log.user?.email || 'N/A',
        log.action,
        log.entity_type,
        log.entity_id,
        log.ip_address || 'N/A',
        log.user_agent || 'N/A',
        new Date(log.created_at).toISOString(),
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    })
  } catch (error) {
    console.error('Audit logs export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}
