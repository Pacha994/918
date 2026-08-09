import { NextResponse } from 'next/server'
import { getTallerId } from '@/lib/auth'

const IDTAG_BASE_URL = 'https://918tag.com/api/public/bikes'
const TIMEOUT_MS = 4000

// GET /api/tagmaker/[idtag] — proxy server-side hacia el endpoint público de
// 918TAG. Server-side a propósito: 918tag.com no manda headers CORS en esa
// ruta, así que un fetch directo desde el browser del taller lo bloquearía.
// Acá no hay problema porque es server-to-server.
//
// Exige sesión propia (getTallerId()) igual que el resto de las rutas de
// este repo, aunque el dato que trae sea público del lado de 918TAG - no
// tiene sentido dejarla como la única puerta sin sesión.
export async function GET(request, { params }) {
  const tallerId = await getTallerId()
  if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { idtag } = await params

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${IDTAG_BASE_URL}/${encodeURIComponent(idtag)}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const data = await res.json()

    // Kit inexistente en 918TAG -> 404 arriba. Kit existente pero nunca
    // activado -> 200 con solo {status:'INACTIVE'}, sin bike. Los dos casos
    // son "no hay datos para autocompletar" desde acá.
    if (!data?.bike) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      brand:        data.bike.brand,
      model:        data.bike.model,
      year:         data.bike.year,
      color:        data.bike.color,
      serialNumber: data.bike.serialNumber,
      services:     data.services ?? [],
    })
  } catch (error) {
    // Cubre timeout (AbortError), 918TAG caído, JSON inválido - cualquier
    // fallo upstream se traduce siempre a un "no encontrado" limpio, nunca
    // una excepción sin manejar hacia el form del taller.
    console.error('GET /api/tagmaker/[idtag]:', error.message)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  } finally {
    clearTimeout(timeout)
  }
}
