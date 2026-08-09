import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashTokenAprobacion } from '@/lib/aprobacion'

// Ruta pública a propósito - NO usa getTallerId(). Es el link que abre el
// cliente final desde WhatsApp, sin sesión de taller. La seguridad no pasa
// por auth de taller acá, pasa por el token de 256 bits + el lookup atómico
// {id, tokenHash} de abajo. No está en el matcher de src/middleware.js, así
// que ni siquiera pasa por esa capa.

async function buscarHallazgoAutenticado(hallazgoId, token) {
  if (!token) return null
  const hash = hashTokenAprobacion(token)
  return prisma.hallazgo.findFirst({
    where: { id: hallazgoId, aprobacionTokenHash: hash },
    select: {
      id: true,
      estado: true,
      respondidoEn: true,
      aprobacionTokenExpira: true,
      descripcion: true,
      precio: true,
      fotoUrl: true,
      creadoEn: true,
      biciId: true,
      bici: { select: { modelo: true, marca: true } },
    },
  })
}

// GET /api/aprobar/[hallazgoId]?token=... — exige token igual que el PATCH,
// no solo para confirmar sino también para ver el detalle (precio,
// descripción, foto son datos del cliente, no algo que cualquiera con el
// id debería poder ver).
export async function GET(request, { params }) {
  try {
    const { hallazgoId } = await params
    const token = request.nextUrl.searchParams.get('token')

    const hallazgo = await buscarHallazgoAutenticado(hallazgoId, token)

    // Sin match (token inventado, vencido de otro hallazgo, id que no
    // corresponde) -> un solo mensaje genérico, no distinguimos causa.
    if (!hallazgo) {
      return NextResponse.json({ estado: 'invalido' }, { status: 404 })
    }

    // La fuente de verdad es siempre el estado real del hallazgo, sin
    // importar si lo resolvió este mismo link o el mecánico desde el
    // kanban - los dos casos caen acá, con el mismo mensaje.
    if (hallazgo.estado !== 'pendiente') {
      return NextResponse.json({
        estado: 'resuelto',
        decision: hallazgo.estado,
        fecha: hallazgo.respondidoEn,
        descripcion: hallazgo.descripcion,
        precio: hallazgo.precio,
      })
    }

    if (!hallazgo.aprobacionTokenExpira || hallazgo.aprobacionTokenExpira < new Date()) {
      return NextResponse.json({ estado: 'vencido' })
    }

    return NextResponse.json({
      estado: 'pendiente',
      descripcion: hallazgo.descripcion,
      precio: hallazgo.precio,
      fotoUrl: hallazgo.fotoUrl,
      creadoEn: hallazgo.creadoEn,
      bici: hallazgo.bici,
    })
  } catch (error) {
    console.error('GET /api/aprobar/[hallazgoId]:', error.message)
    return NextResponse.json({ estado: 'invalido' }, { status: 404 })
  }
}

// PATCH /api/aprobar/[hallazgoId] — body { token, decision: 'aprobado'|'rechazado' }
export async function PATCH(request, { params }) {
  try {
    const { hallazgoId } = await params
    const body = await request.json().catch(() => ({}))
    const { token, decision } = body

    if (!token || !['aprobado', 'rechazado'].includes(decision)) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    const hash = hashTokenAprobacion(token)
    const ahora = new Date()

    // Update condicional: el where incluye estado:'pendiente' Y vigencia
    // del token en la misma query, para que el chequeo y la escritura sean
    // atómicos. Evita la carrera con el mecánico resolviendo desde el
    // kanban al mismo tiempo - si alguno de los dos gana primero, el
    // segundo update no matchea ninguna fila (count 0).
    const resultado = await prisma.hallazgo.updateMany({
      where: {
        id: hallazgoId,
        aprobacionTokenHash: hash,
        estado: 'pendiente',
        aprobacionTokenExpira: { gt: ahora },
      },
      data: {
        estado: decision,
        respondidoEn: ahora,
        aprobacionTokenUsadoEn: ahora,
      },
    })

    if (resultado.count === 0) {
      // No matcheó: token/id inválido, ya resuelto, o vencido. El front
      // vuelve a pedir el GET para mostrar el estado real y el mensaje
      // correcto - acá no hace falta distinguir la causa.
      return NextResponse.json({ ok: false })
    }

    const hallazgo = await prisma.hallazgo.findUnique({
      where: { id: hallazgoId },
      select: { biciId: true, descripcion: true },
    })

    // Tipo de evento distinto al que ya usa el mecánico desde el kanban
    // (hallazgo_aprobado / hallazgo_rechazado en api/hallazgos/[id]) - acá
    // queda registrado que lo resolvió el cliente vía link, no el taller.
    await prisma.eventoHistorial.create({
      data: {
        biciId: hallazgo.biciId,
        tipo: decision === 'aprobado' ? 'hallazgo_aprobado_cliente' : 'hallazgo_rechazado_cliente',
        descripcion: `Hallazgo ${decision} por el cliente vía link: ${hallazgo.descripcion}`,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('PATCH /api/aprobar/[hallazgoId]:', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
