import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/hallazgos — crear hallazgo
export async function POST(request) {
  try {
    const body = await request.json()
    const { biciId, descripcion, precio, fotoUrl } = body

    if (!biciId || !descripcion || precio == null || Number(precio) < 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
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
