import { NextResponse } from 'next/server'
import { prisma }        from '@/lib/prisma'

const COOKIE_NAME    = '918_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 año

export async function POST(request) {
  try {
    const { whatsapp } = await request.json()

    if (!whatsapp?.trim()) {
      return NextResponse.json({ error: 'WhatsApp requerido' }, { status: 400 })
    }

    const taller = await prisma.taller.findUnique({
      where: { whatsapp: whatsapp.trim() }
    })

    if (!taller) {
      return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 })
    }

    const response = NextResponse.json({ ok: true, tallerId: taller.id })

    response.cookies.set(COOKIE_NAME, taller.id, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   COOKIE_MAX_AGE,
      path:     '/',
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/login:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
