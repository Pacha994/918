import { NextResponse } from 'next/server'

const COOKIE_NAME    = '918_session'
const RUTAS_PRIVADAS = ['/kanban', '/registro', '/configuracion', '/bici']
const RUTAS_PUBLICAS = ['/login', '/onboarding']

export function middleware(request) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(COOKIE_NAME)?.value

  const esPrivada = RUTAS_PRIVADAS.some(r => pathname.startsWith(r))
  if (esPrivada && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const esPublica = RUTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (esPublica && session) {
    return NextResponse.redirect(new URL('/kanban', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/kanban', '/kanban/:path*',
    '/registro', '/registro/:path*',
    '/configuracion', '/configuracion/:path*',
    '/bici/:path*',
    '/login',
    '/onboarding', '/onboarding/:path*',
  ],
}
