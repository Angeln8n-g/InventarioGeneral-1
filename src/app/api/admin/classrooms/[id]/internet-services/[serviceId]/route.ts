import { NextRequest, NextResponse } from 'next/server'
import { internetServiceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { serviceId } = await params
      const svcId = parseInt(serviceId, 10)
      
      if (isNaN(svcId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid service ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const service = await internetServiceOperations.getById(svcId)
      if (!service) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Service not found', timestamp: new Date().toISOString() } 
        }, { status: 404 })
      }

      return NextResponse.json({ data: service })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { serviceId } = await params
      const svcId = parseInt(serviceId, 10)
      
      if (isNaN(svcId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid service ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const body = await request.json()
      const updated = await internetServiceOperations.update(svcId, body)

      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'internet_service_update',
          entity_type: 'internet_service',
          entity_id: svcId,
          new_values: body,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
      } catch (auditError) {
        console.error('[Internet Services API] Audit log error:', auditError)
      }

      return NextResponse.json({ data: updated, message: 'Service updated' })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { serviceId } = await params
      const svcId = parseInt(serviceId, 10)
      
      if (isNaN(svcId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid service ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      await internetServiceOperations.delete(svcId)

      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'internet_service_delete',
          entity_type: 'internet_service',
          entity_id: svcId,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
      } catch (auditError) {
        console.error('[Internet Services API] Audit log error:', auditError)
      }

      return NextResponse.json({ message: 'Service deleted' })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}
