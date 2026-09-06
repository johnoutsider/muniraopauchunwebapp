import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'le_session'

/** Rol tekshiruvi server komponentlarida (requireUser) qilinadi.
 *  Middleware faqat sessiya cookie mavjudligini tekshiradi (edge'da tez). */
const PROTECTED = ['/student', '/teacher', '/researcher', '/admin', '/onboarding', '/consent']
const AUTH_PAGES = ['/login', '/register', '/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/redirect'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|.*\.(?:png|jpg|jpeg|svg|webp|mp3|wav)$).*)'],
}
