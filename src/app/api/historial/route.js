import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

const PAGE_SIZE = 20

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(0, parseInt(searchParams.get('page') || '0'))

    const hoyUTC = new Date()
    hoyUTC.setUTCHours(0, 0, 0, 0)

    const bicis = await prisma.bici.findMany({
      where: {
        tallerId: TALLER_ID,
        estado: 'entregada',
        OR: [
          { deliveredAt: { lt: hoyUTC } },
          { deliveredAt: null },
        ],
      },
      select: {
        id:          true,
        modelo:      true,
        deliveredAt: true,
        estado:      true,
        cliente: {
          select: { nombre: true }
        },
      },
      orderBy: { deliveredAt: 'desc' },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    })

    return NextResponse.json(bicis)
  } catch (error) {
    console.error('GET /api/historial:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
