import { NextRequest, NextResponse } from 'next/server'
import { classroomOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { validateClassroomInput } from '@/types/classrooms'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const classroomId = parseInt(id, 10)
      const classroom = await classroomOperations.getById(classroomId)
      if (!classroom) {
        return NextResponse.json({ error: { code: ERROR_CODES.NOT_FOUND, message: 'Classroom not found', timestamp: new Date().toISOString() } }, { status: 404 })
      }
      return NextResponse.json({ data: classroom })
    })
  } catch {
    return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR, message: ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const classroomId = parseInt(id, 10)
      const body = await request.json()
      const validation = validateClassroomInput({ ...body, name: body.name ?? 'tmp', location: body.location ?? 'tmp', status: body.status ?? 'active' })
      if (!validation.isValid) {
        return NextResponse.json({ error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Validation failed', details: validation.errors, timestamp: new Date().toISOString() } }, { status: 400 })
      }
      const updated = await classroomOperations.update(classroomId, body)
      await auditLogOperations.create({ user_id: auth.user.id, action: 'classroom_update', entity_type: 'classroom', entity_id: classroomId, new_values: body, ip_address: request.headers.get('x-forwarded-for') || 'unknown', user_agent: request.headers.get('user-agent') || 'unknown' })
      return NextResponse.json({ data: updated, message: 'Classroom updated' })
    })
  } catch {
    return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR, message: ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const classroomId = parseInt(id, 10)
      try {
        await classroomOperations.delete(classroomId)
      } catch (err: any) {
        if (err?.code === 'HAS_ASSIGNED_DEVICES') {
          return NextResponse.json({ error: { code: 'HAS_ASSIGNED_DEVICES', message: 'No se puede eliminar aula con dispositivos asignados', timestamp: new Date().toISOString() } }, { status: 409 })
        }
        throw err
      }
      await auditLogOperations.create({ user_id: auth.user.id, action: 'classroom_delete', entity_type: 'classroom', entity_id: classroomId, ip_address: request.headers.get('x-forwarded-for') || 'unknown', user_agent: request.headers.get('user-agent') || 'unknown' })
      return NextResponse.json({ message: 'Classroom deleted' })
    })
  } catch {
    return NextResponse.json({ error: { code: ERROR_CODES.DATABASE_ERROR, message: ERROR_MESSAGES.GENERIC_ERROR, timestamp: new Date().toISOString() } }, { status: 500 })
  }
}

