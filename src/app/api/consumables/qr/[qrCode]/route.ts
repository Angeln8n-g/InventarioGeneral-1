import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    return await withAuth(request, async (authContext) => {
      const { qrCode: qrCodeParam } = await params
      const qrCode = decodeURIComponent(qrCodeParam)

      // Validate QR code format
      if (!qrCode.startsWith('CONSUMABLE-')) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid consumable QR code format',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Look up consumable by QR code
      const { data: consumable, error } = await supabase
        .from('consumable_stock')
        .select(`
          *,
          item_type:item_types(*)
        `)
        .eq('qr_code', qrCode)
        .single()

      if (error || !consumable) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Consumable not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: consumable,
      })
    })
  } catch (error: unknown) {
    console.error('Consumable QR lookup error:', error)

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
