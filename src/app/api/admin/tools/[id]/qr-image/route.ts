import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    return await withPermission(request, PERMISSIONS.TOOLS_GENERATE_QR, async (authContext) => {
      const toolId = parseInt(resolvedParams.id, 10)
      
      if (isNaN(toolId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid tool ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get tool information
      const tool = await toolInstanceOperations.getById(toolId)
      
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

      // Generate QR code image
      const qrCodeOptions = {
        type: 'png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      }

      const qrCodeBuffer = await QRCode.toBuffer(tool.qr_code, qrCodeOptions)

      // Create audit log for QR code generation
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'qr_code_generated',
          entity_type: 'tool_instance',
          entity_id: toolId,
          new_values: {
            qr_code: tool.qr_code,
            generated_at: new Date().toISOString(),
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the request if audit logging fails
      }

      // Return QR code image
      return new NextResponse(qrCodeBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': qrCodeBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="tool-${toolId}-qr.png"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      })
    })
  } catch (error: unknown) {
    console.error('QR code generation error:', error)

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