import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for session cart cookie
  if (!request.cookies.get('sessionCartId')) {
    // Generate new session cart id cookie
    const sessionCartId = crypto.randomUUID()

    // Create new response and add the new headers
    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    })

    // Set newly generated sessionCartId in the response cookies
    response.cookies.set('sessionCartId', sessionCartId)

    return response
  }

  // Array of regex patterns of paths we want to protect
  const protectedPaths = [
    /\/shipping-address/,
    /\/payment-method/,
    /\/place-order/,
    /\/profile/,
    /\/user\/(.*)/,
    /\/order\/(.*)/,
    /\/admin/,
  ]

  // Get pathname from the req URL object
  const { pathname } = request.nextUrl

  // Check if accessing a protected path
  if (protectedPaths.some((p) => p.test(pathname))) {
    // Check for auth token (both regular and secure cookies)
    const session =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token')

    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only apply to routes that need protection or cookie handling
    '/shipping-address',
    '/payment-method',
    '/place-order',
    '/profile',
    '/user/:path*',
    '/order/:path*',
    '/admin/:path*',
  ],
}
