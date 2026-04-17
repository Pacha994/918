import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ESTADOS = ['ingresada', 'diagnostico', 'reparacion', 'lista', 'entregada']

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Si viene estado explícito, usarlo directo
    if (body.estado) {
      const bici = await prisma.bici.update({
        where: { id },
        data: { estado: body.estado },
        include: { cliente: true, fotos: true }
      })
      return NextResponse.json(bici)
    }

    // Avanzar al siguiente estado
    const biciActual = await prisma.bici.findUnique({
      where: { id }
    })

    if (!biciActual) {
      return NextResponse.json({ error: 'Bici no encontrada' }, { status: 404 })
    }

    const indexActual = ESTADOS.indexOf(biciActual.estado)
    if (indexActual === -1 || indexActual === ESTADOS.length - 1) {
      return NextResponse.json({ error: 'No se puede avanzar más' }, { status: 400 })
    }

    const nuevoEstado = ESTADOS[indexActual + 1]

    const bici = await prisma.bici.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: { cliente: true, fotos: true }
    })

    return NextResponse.json(bici)
  } catch (error) {
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
