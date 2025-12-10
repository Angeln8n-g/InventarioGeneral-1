import { NextRequest, NextResponse } from 'next/server'
import { classroomReservationOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { reservationId } = await params
      const resId = parseInt(reservationId, 10)
      
      if (isNaN(resId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid reservation ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const reservation = await classroomReservationOperations.getById(resId)
      if (!reservation) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Reservation not found', timestamp: new Date().toISOString() } 
        }, { status: 404 })
      }

      return NextResponse.json({ data: reservation })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { reservationId } = await params
      const resId = parseInt(reservationId, 10)
      
      if (isNaN(resId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid reservation ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const body = await request.json()
      const updated = await classroomReservationOperations.update(resId, body)

      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'classroom_reservation_update',
          entity_type: 'classroom_reservation',
          entity_id: resId,
          new_values: body,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
      } catch (auditError) {
        console.error('[Classroom Reservations API] Audit log error:', auditError)
      }

      return NextResponse.json({ data: updated, message: 'Reservation updated' })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reservationId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { reservationId } = await params
      const resId = parseInt(reservationId, 10)
      
      if (isNaN(resId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid reservation ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      await classroomReservationOperations.delete(resId)

      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'classroom_reservation_delete',
          entity_type: 'classroom_reservation',
          entity_id: resId,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
      } catch (auditError) {
        console.error('[Classroom Reservations API] Audit log error:', auditError)
      }

      return NextResponse.json({ message: 'Reservation deleted' })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}
