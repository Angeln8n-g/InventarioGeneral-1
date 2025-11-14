import { NextRequest, NextResponse } from 'next/server'
import { userOperations } from '@/lib/supabase-client'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error(
    '🔒 SECURITY ERROR: JWT_SECRET environment variable is required!\n' +
    'Generate a secure secret with: openssl rand -base64 32\n' +
    'Add it to your .env file: JWT_SECRET=your_generated_secret'
  )
}

export async function GET(request: NextRequest) {
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
      
      // Get current user data
      const user = await userOperations.getById(decoded.userId)
      
      if (!user) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'User not found' } },
          { status: 404 }
        )
      }
      
      // Return user data (without password)
      const { password_hash: _password_hash, ...userWithoutPassword } = user
      
      return NextResponse.json({
        user: userWithoutPassword
      })
      
    } catch (_jwtError) {
      return NextResponse.json(
        { error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid token' } },
        { status: 401 }
      )
    }
    
  } catch (error: unknown) {
    console.error('Profile fetch error:', error)
    
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    )
  }
}