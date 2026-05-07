import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

export async function GET() {
  try {
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
        tipoServicio: true,
        precio:      true,
        deliveredAt: true,
        estado:      true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 500,
    })

    return NextResponse.json(bicis)
  } catch (error) {
    console.error('GET /api/historial:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
