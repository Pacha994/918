import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

export async function GET() {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const ahora = new Date()

    const inicioMes = new Date(ahora)
    inicioMes.setUTCDate(1)
    inicioMes.setUTCHours(0, 0, 0, 0)

    const bicis = await prisma.bici.findMany({
      where: {
        tallerId,
        estado:   'entregada',
        deliveredAt: { gte: inicioMes },
      },
      select: { creadoEn: true, deliveredAt: true, precio: true },
    })

    const count = bicis.length

    const revenue = bicis.reduce((sum, b) => sum + (b.precio ?? 0), 0)

    const avgDias = count > 0
      ? bicis.reduce((sum, b) => {
          const ms = new Date(b.deliveredAt) - new Date(b.creadoEn)
          return sum + ms / (1000 * 60 * 60 * 24)
        }, 0) / count
      : 0

    return NextResponse.json({
      count,
      avgDias: Math.round(avgDias * 10) / 10,
      revenue,
    })
  } catch (error) {
    console.error('GET /api/historial/resumen:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
