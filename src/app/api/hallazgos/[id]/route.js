import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

// PATCH /api/hallazgos/[id] — aprobar o rechazar
export async function PATCH(request, { params }) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body   = await request.json()
    const { estado } = body

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // El hallazgo no tiene tallerId propio, se verifica via la bici. 404 en
    // vez de 403 - no confirmarle a otro taller que el id existe pero es ajeno.
    const propio = await prisma.hallazgo.findFirst({
      where: { id, bici: { tallerId } },
      select: { id: true },
    })
    if (!propio) {
      return NextResponse.json({ error: 'Hallazgo no encontrado' }, { status: 404 })
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
