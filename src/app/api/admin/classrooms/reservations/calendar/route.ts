import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { searchParams } = new URL(request.url)
      const start = searchParams.get('start')
      const end = searchParams.get('end')

      if (!start || !end) {
        return NextResponse.json({
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Start and end dates are required', timestamp: new Date().toISOString() }
        }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('classroom_reservations')
        .select(`
          id,
          classroom_id,
          title,
          start_datetime,
          end_datetime,
          status,
          classroom:classrooms(name)
        `)
        .gte('start_datetime', start)
        .lte('end_datetime', end)
        .neq('status', 'cancelled')
        .order('start_datetime', { ascending: true })

      if (error) throw error

      const reservations = (data || []).map((r: any) => ({
        id: r.id,
        classroom_id: r.classroom_id,
        classroom_name: r.classroom?.name || 'Sin nombre',
        title: r.title,
        start_datetime: r.start_datetime,
        end_datetime: r.end_datetime,
        status: r.status
      }))

      return NextResponse.json({ data: reservations, total: reservations.length })
    })
  } catch (error: any) {
    console.error('[Calendar API] Error:', error)
    return NextResponse.json({
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() }
    }, { status: 500 })
  }
}
