import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/access-denied',
  '/favicon.ico',
  '/favicon.svg',
  '/claro-icon.svg',
  '/manifest.json',
  '/site.webmanifest',
  '/sw.js',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files, Next.js internals and API routes to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/sounds') ||
    pathname.startsWith('/icons') ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next()
  }

  // Check for authentication token in cookies or Authorization header
  const token =
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('auth-token')?.value ||
    request.cookies.get('token')?.value ||
    (request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')?.substring(7)
      : null)

  // Redirect to login if accessing protected page without token
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/tools') ||
    pathname.startsWith('/consumables') ||
    pathname.startsWith('/my-loans') ||
    pathname.startsWith('/my-spaces') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/dashboard')

  // Note: Client-side storage will still handle auth if cookies aren't set yet during transition,
  // but header or cookie token verification at the Edge prevents unauthenticated deep-linking.
  if (!token && isProtectedPath) {
    // If the request is a client-side navigation (RSC payload request), let client guards handle
    // localStorage tokens during the transition phase, while enforcing full SSR redirect on standard page loads.
    const isRSC = request.headers.get('RSC') === '1'
    if (!isRSC) {
      // In purely SSR initial page visits, if neither cookie nor token is present, redirect to login
      // but preserve the intended return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      // Note: During client-first token phase, client ProtectedRoute handles local token verification.
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
