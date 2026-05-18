import { NextResponse } from 'next/server'
import { prisma }       from '@/lib/prisma'
import { TALLER_ID }    from '@/lib/config'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const bici = await prisma.bici.findFirst({
      where: { id, tallerId: TALLER_ID, estado: 'entregada' },
      select: {
        id:           true,
        modelo:       true,
        color:        true,
        tipoServicio: true,
        precio:       true,
        notas:        true,
        creadoEn:     true,
        deliveredAt:  true,
        cliente: { select: { nombre: true, whatsapp: true } },
        hallazgos: {
          select: { id: true, descripcion: true, precio: true, estado: true, fotoUrl: true, creadoEn: true },
          orderBy: { creadoEn: 'asc' },
        },
        fotos: {
          select: { url: true, angulo: true },
          orderBy: { creadoEn: 'asc' },
        },
      },
    })

    if (!bici) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    return NextResponse.json(bici)
  } catch (error) {
    console.error('GET /api/historial/[id]:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
