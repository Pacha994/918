import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/hallazgos/[id] — aprobar o rechazar
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body   = await request.json()
    const { estado } = body

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const hallazgo = await prisma.hallazgo.update({
      where: { id },
      data: {
        estado,
        respondidoEn: new Date(),
      },
    })

    // Registrar evento en historial
    await prisma.eventoHistorial.create({
      data: {
        biciId:      hallazgo.biciId,
        tipo:        estado === 'aprobado' ? 'hallazgo_aprobado' : 'hallazgo_rechazado',
        descripcion: `Hallazgo ${estado}: ${hallazgo.descripcion}`,
      },
    })

    return NextResponse.json(hallazgo)
  } catch (error) {
    console.error('PATCH /api/hallazgos/[id]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
