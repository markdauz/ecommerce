import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const protectedPaths = [
  /\/shipping-address/,
  /\/payment-method/,
  /\/place-order/,
  /\/profile/,
  /\/user\/(.*)/,
  /\/order\/(.*)/,
  /\/admin/,
]

export default auth((req) => {
  const { nextUrl, auth: session } = req

  // Block access if unauthenticated + accessing protected route
  if (!session && protectedPaths.some((p) => p.test(nextUrl.pathname))) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Ensure sessionCartId cookie exists
  if (!req.cookies.get('sessionCartId')) {
    const sessionCartId = crypto.randomUUID()
    const res = NextResponse.next({
      request: { headers: new Headers(req.headers) },
    })
    res.cookies.set('sessionCartId', sessionCartId)
    return res
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next|static|.*\\..*).*)'], // apply to all pages except assets/api
}
