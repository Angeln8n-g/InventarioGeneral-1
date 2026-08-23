import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const alerts: any[] = []

      const nowISO = new Date().toISOString()

      // Run all 3 queries concurrently in parallel
      const [
        { data: stockData, error: stockError },
        { data: overdueLoans, error: loansError },
        { data: itemTypes, error: itemTypesError },
      ] = await Promise.all([
        supabase
          .from('consumable_stock')
          .select(`
            id,
            current_quantity,
            minimum_threshold,
            item_types!inner(id, name)
          `),
        supabase
          .from('loans')
          .select(`
            id,
            due_date,
            users!inner(username),
            tool_instances!inner(item_types!inner(name))
          `)
          .eq('status', 'active')
          .is('return_date', null)
          .lt('due_date', nowISO),
        supabase
          .from('item_types')
          .select(`
            id,
            name,
            tool_instances(id, status)
          `)
          .eq('is_consumable', false),
      ])

      const firstError = stockError || loansError || itemTypesError
      if (firstError) throw firstError

      // Process critical stock alerts
      stockData?.forEach((stock: any) => {
        if (stock.current_quantity <= stock.minimum_threshold) {
          alerts.push({
            id: alerts.length + 1,
            type: 'critical_stock',
            severity: stock.current_quantity === 0 ? 'critical' : 'warning',
            title: `Stock Crítico: ${stock.item_types?.name || 'Ítem'}`,
            message: `El stock actual (${stock.current_quantity}) está ${
              stock.current_quantity === 0 ? 'agotado' : `por debajo del mínimo (${stock.minimum_threshold})`
            }`,
            link: `/admin/consumables?id=${stock.item_types?.id}`,
            timestamp: new Date().toISOString(),
          })
        }
      })

      // Process overdue loans alerts
      overdueLoans?.forEach((loan: any) => {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        alerts.push({
          id: alerts.length + 1,
          type: 'overdue_loans',
          severity: daysOverdue > 7 ? 'critical' : 'warning',
          title: `Préstamo Vencido: ${loan.users?.username || 'Usuario'}`,
          message: `${loan.tool_instances?.item_types?.name || 'Herramienta'} - Vencido hace ${daysOverdue} días`,
          link: `/admin/loans?id=${loan.id}`,
          timestamp: loan.due_date,
        })
      })

      itemTypes?.forEach((itemType: any) => {
        const instances = itemType.tool_instances || []
        const totalInstances = instances.length
        const availableInstances = instances.filter((i: any) => i.status === 'available').length

        if (totalInstances > 0) {
          const availabilityRate = availableInstances / totalInstances

          if (availabilityRate < 0.2) {
            alerts.push({
              id: alerts.length + 1,
              type: 'low_availability',
              severity: 'warning',
              title: `Baja Disponibilidad: ${itemType.name}`,
              message: `Solo ${availableInstances} de ${totalInstances} unidades disponibles (${Math.round(availabilityRate * 100)}%)`,
              link: `/admin/tools?id=${itemType.id}`,
              timestamp: new Date().toISOString(),
            })
          }
        }
      })

      // Sort alerts by severity and timestamp
      alerts.sort((a, b) => {
        const severityOrder = { critical: 1, warning: 2, info: 3 }
        if (severityOrder[a.severity as keyof typeof severityOrder] !== severityOrder[b.severity as keyof typeof severityOrder]) {
          return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      return NextResponse.json({ data: alerts })
    })
  } catch (error: unknown) {
    console.error('Alerts statistics error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        { error: { code: ERROR_CODES.AUTHENTICATION_ERROR, message: error.message } },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: { code: ERROR_CODES.AUTHORIZATION_ERROR, message: error.message } },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: { code: 'STATS_009', message: ERROR_MESSAGES.GENERIC_ERROR } },
      { status: 500 }
    )
  }
}
