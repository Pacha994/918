import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ESTADOS_VALIDOS = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { status, archivarAhora } = body

    if (!status || !ESTADOS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const data = { estado: status }

    if (status === 'entregada') {
      if (archivarAhora) {
        // Fuerza salida inmediata del kanban: deliveredAt antes de medianoche de hoy UTC
        const hoyUTC = new Date()
        hoyUTC.setUTCHours(0, 0, 0, 0)
        data.deliveredAt = new Date(hoyUTC.getTime() - 1)
      } else {
        data.deliveredAt = new Date()
      }
    }

    const bici = await prisma.bici.update({
      where: { id },
      data,
      include: { cliente: true, fotos: true }
    })

    return NextResponse.json(bici)
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Bici no encontrada' }, { status: 404 })
    }
    console.error('PATCH /api/bicis/[id]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const bici = await prisma.bici.findUnique({
      where: { id },
      include: { cliente: true, fotos: true, hallazgos: true }
    })

    if (!bici) {
      return NextResponse.json({ error: 'Bici no encontrada' }, { status: 404 })
    }

    return NextResponse.json(bici)
  } catch (error) {
    console.error('GET /api/bicis/[id]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
