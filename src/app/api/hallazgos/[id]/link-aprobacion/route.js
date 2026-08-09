import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'
import { generarTokenAprobacion, hashTokenAprobacion, calcularExpiracion } from '@/lib/aprobacion'

// POST /api/hallazgos/[id]/link-aprobacion — genera (o regenera) el link
// público de /aprobar/[hallazgoId] para este hallazgo. Requiere sesión de
// taller (esto lo dispara el mecánico desde el kanban, no es la ruta
// pública). Devuelve solo el token crudo - nunca se guarda, solo su hash.
export async function POST(request, { params }) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params

    // Scoping: el hallazgo tiene que ser de una bici de este taller.
    const hallazgo = await prisma.hallazgo.findFirst({
      where: { id, bici: { tallerId } },
      select: { id: true, estado: true },
    })
    if (!hallazgo) {
      return NextResponse.json({ error: 'Hallazgo no encontrado' }, { status: 404 })
    }

    if (hallazgo.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Este hallazgo ya fue resuelto' }, { status: 400 })
    }

    const token = generarTokenAprobacion()

    // Regenerar pisa el hash anterior - cualquier link viejo de este mismo
    // hallazgo deja de servir automáticamente. aprobacionTokenUsadoEn se
    // resetea a null: un link nuevo es una oportunidad nueva.
    await prisma.hallazgo.update({
      where: { id },
      data: {
        aprobacionTokenHash: hashTokenAprobacion(token),
        aprobacionTokenExpira: calcularExpiracion(),
        aprobacionTokenUsadoEn: null,
      },
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('POST /api/hallazgos/[id]/link-aprobacion:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
