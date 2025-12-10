import { NextRequest, NextResponse } from 'next/server'
import { classroomOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { validateClassroomInput } from '@/types/classrooms'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const classrooms = await classroomOperations.getAll()
      
      // Get reservation and internet service stats
      let reservationStats = { total: 0, active: 0, thisMonth: 0 }
      let internetServicesCount = 0
      
      try {
        const stats = await classroomOperations.getStats()
        reservationStats = {
          total: stats.totalReservations,
          active: stats.activeReservations,
          thisMonth: stats.reservationsThisMonth,
        }
        internetServicesCount = stats.internetServicesCount
      } catch (statsError) {
        console.error('[Classrooms API] Stats error (non-critical):', statsError)
      }
      
      return NextResponse.json({ 
        data: classrooms, 
        total: classrooms.length,
        reservationStats,
        internetServicesCount,
      })
    })
  } catch (error: any) {
    return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR, message: ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      console.log('[Classrooms API] POST request received')
      
      const body = await request.json()
      console.log('[Classrooms API] Request body:', body)
      
      const validation = validateClassroomInput(body)
      console.log('[Classrooms API] Validation result:', validation)
      
      if (!validation.isValid) {
        console.log('[Classrooms API] Validation failed:', validation.errors)
        return NextResponse.json({ 
          error: { 
            code: ERROR_CODES.VALIDATION_ERROR, 
            message: 'Validation failed', 
            details: validation.errors, 
            timestamp: new Date().toISOString() 
          } 
        }, { status: 400 })
      }
      
      console.log('[Classrooms API] Creating classroom...')
      const classroom = await classroomOperations.create(body)
      console.log('[Classrooms API] Classroom created:', classroom)
      
      try {
        await auditLogOperations.create({ 
          user_id: auth.user.id, 
          action: 'classroom_create', 
          entity_type: 'classroom', 
          entity_id: classroom.id, 
          new_values: body, 
          ip_address: request.headers.get('x-forwarded-for') || 'unknown', 
          user_agent: request.headers.get('user-agent') || 'unknown' 
        })
      } catch (auditError) {
        console.error('[Classrooms API] Audit log error (non-critical):', auditError)
      }
      
      return NextResponse.json({ data: classroom, message: 'Classroom created' }, { status: 201 })
    })
  } catch (error: any) {
    console.error('[Classrooms API] Error:', error)
    console.error('[Classrooms API] Error code:', error?.code)
    console.error('[Classrooms API] Error message:', error?.message)
    console.error('[Classrooms API] Error stack:', error?.stack)
    
    if (error?.code === '23505' || error?.code === 'DUPLICATE_NAME') {
      return NextResponse.json({ 
        error: { 
          code: 'DUPLICATE_NAME', 
          message: 'Ya existe un aula con ese nombre en esta localidad', 
          timestamp: new Date().toISOString() 
        } 
      }, { status: 409 })
    }
    
    if (error?.name === 'AuthenticationError') {
      return NextResponse.json({ 
        error: { 
          code: ERROR_CODES.AUTHENTICATION_ERROR, 
          message: error.message, 
          timestamp: new Date().toISOString() 
        } 
      }, { status: 401 })
    }
    
    if (error?.name === 'AuthorizationError') {
      return NextResponse.json({ 
        error: { 
          code: ERROR_CODES.AUTHORIZATION_ERROR, 
          message: error.message, 
          timestamp: new Date().toISOString() 
        } 
      }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: { 
        code: ERROR_CODES.DATABASE_ERROR, 
        message: error?.message || ERROR_MESSAGES.GENERIC_ERROR, 
        timestamp: new Date().toISOString() 
      } 
    }, { status: 500 })
  }
}

