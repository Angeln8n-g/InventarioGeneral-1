import { NextRequest, NextResponse } from 'next/server'
import { internetServiceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { validateInternetServiceInput } from '@/types/classrooms'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const classroomId = parseInt(id, 10)
      
      if (isNaN(classroomId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid classroom ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const services = await internetServiceOperations.getByClassroom(classroomId)
      return NextResponse.json({ data: services, total: services.length })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const classroomId = parseInt(id, 10)
      
      if (isNaN(classroomId)) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid classroom ID', timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const body = await request.json()
      const input = { ...body, classroom_id: classroomId }
      
      const validation = validateInternetServiceInput(input)
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Validation failed', details: validation.errors, timestamp: new Date().toISOString() } 
        }, { status: 400 })
      }

      const service = await internetServiceOperations.create(input, auth.user.id)
      
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'internet_service_create',
          entity_type: 'internet_service',
          entity_id: service.id,
          new_values: input,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
      } catch (auditError) {
        console.error('[Internet Services API] Audit log error:', auditError)
      }

      return NextResponse.json({ data: service, message: 'Service created' }, { status: 201 })
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: { code: ERROR_CODES.DATABASE_ERROR, message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } 
    }, { status: 500 })
  }
}
