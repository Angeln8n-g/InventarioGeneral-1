import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { isValidUUID } from '@/lib/supabase-client'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const resolvedParams = await params
    return await withAuth(request, async (authContext) => {
      const { uuid } = resolvedParams

      // Validate UUID format
      if (!isValidUUID(uuid)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.INVALID_QR_CODE,
              message: ERROR_MESSAGES.INVALID_QR_FORMAT,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Look up tool by QR code
      const tool = await toolInstanceOperations.getByQRCode(uuid)

      if (!tool) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: ERROR_MESSAGES.TOOL_NOT_FOUND,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Create audit log for tool lookup
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'tool_lookup',
          entity_type: 'tool_instance',
          entity_id: tool.id,
          new_values: { qr_code: uuid, lookup_time: new Date().toISOString() },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the request if audit logging fails
      }

      // If tool is loaned, get active loan information
      let activeLoan = null
      if (tool.status === 'loaned') {
        const { data: loanData } = await supabase
          .from('loans')
          .select(`
            id,
            loan_date,
            due_date,
            user:users(id, username, email)
          `)
          .eq('tool_instance_id', tool.id)
          .eq('status', 'active')
          .single()
        
        if (loanData) {
          activeLoan = {
            id: loanData.id,
            loan_date: loanData.loan_date,
            due_date: loanData.due_date,
            user: loanData.user,
          }
        }
      }

      // Return tool information with availability status
      return NextResponse.json({
        data: {
          ...tool,
          is_available: tool.status === 'available',
          can_be_loaned: tool.status === 'available',
          active_loan: activeLoan,
        },
        message: 'Tool found successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Tool lookup error:', error)

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