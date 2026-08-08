import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

export async function GET() {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const hoyUTC = new Date()
    hoyUTC.setUTCHours(0, 0, 0, 0)

    const bicis = await prisma.bici.findMany({
      where: {
        tallerId,
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
