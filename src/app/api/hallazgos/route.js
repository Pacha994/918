import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

// POST /api/hallazgos — crear hallazgo
export async function POST(request) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { biciId, descripcion, precio, fotoUrl } = body

    if (!biciId || !descripcion || precio == null || Number(precio) < 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // La bici tiene que ser del taller logueado - si no, 404 (no 403, no le
    // confirmamos a nadie que el id existe pero es de otro taller).
    const biciPropia = await prisma.bici.findFirst({ where: { id: biciId, tallerId }, select: { id: true } })
    if (!biciPropia) {
      return NextResponse.json({ error: 'Bici no encontrada' }, { status: 404 })
    }

    const [hallazgo] = await prisma.$transaction([
      prisma.hallazgo.create({
        data: {
          biciId,
          descripcion,
          precio:  Number(precio),
          fotoUrl: fotoUrl || null,
          estado:  'pendiente',
        },
      }),
      prisma.eventoHistorial.create({
        data: {
          biciId,
          tipo:        'hallazgo_enviado',
          descripcion: `Hallazgo enviado: ${descripcion}`,
        },
      }),
    ])

    return NextResponse.json(hallazgo, { status: 201 })
  } catch (error) {
    console.error('POST /api/hallazgos:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
