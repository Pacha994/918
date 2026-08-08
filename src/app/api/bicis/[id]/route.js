import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

const ESTADOS_VALIDOS = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']

export async function PATCH(request, { params }) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { status, archivarAhora } = body

    if (!status || !ESTADOS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Prisma.update no soporta un where compuesto por id + tallerId (id ya es
    // la unique key), asi que la pertenencia se verifica aparte antes de
    // mutar. 404 en vez de 403 - no confirmarle a otro taller que el id
    // existe pero es ajeno.
    const propia = await prisma.bici.findFirst({ where: { id, tallerId }, select: { id: true } })
    if (!propia) {
      return NextResponse.json({ error: 'Bici no encontrada' }, { status: 404 })
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
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const bici = await prisma.bici.findFirst({
      where: { id, tallerId },
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
