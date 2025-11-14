import { NextRequest, NextResponse } from 'next/server'
import { auditLogOperations } from '@/lib/supabase-client'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error(
    '🔒 SECURITY ERROR: JWT_SECRET environment variable is required!\n' +
    'Generate a secure secret with: openssl rand -base64 32\n' +
    'Add it to your .env file: JWT_SECRET=your_generated_secret'
  )
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'No token provided' } },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      
      // Create audit log for logout
      try {
        await auditLogOperations.create({
          user_id: decoded.userId,
          action: 'logout',
          entity_type: 'user',
          entity_id: decoded.userId,
          new_values: { logout_time: new Date().toISOString() },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the logout if audit logging fails
      }
      
    } catch (jwtError) {
      // Token is invalid, but we still want to allow logout
      console.warn('Invalid token during logout:', jwtError)
    }
    
    return NextResponse.json({
      message: 'Logout successful'
    })
    
  } catch (error: unknown) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Logout failed' } },
      { status: 500 }
    )
  }
}