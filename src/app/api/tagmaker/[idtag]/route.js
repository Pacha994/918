import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getTallerId } from '@/lib/auth'

const IDTAG_BASE_URL = 'https://918tag.com/api/public/bikes'
const TIMEOUT_MS = 4000
const PHOTO_TIMEOUT_MS = 4000
const MAX_PHOTOS = 3
const PHOTO_MAX_WIDTH = 1000
const PHOTO_QUALITY = 70

async function fetchConTimeout(url, ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

// Descarga una foto (URL firmada de R2, expira en ~1h - por eso la descarga
// tiene que pasar en el momento de esta request, no se puede guardar la URL
// cruda para usar después) y la recomprime server-side con sharp: mismo
// resultado que el patrón de canvas de registro/page.js (max 1000px de
// ancho, calidad ~70%), pero acá no hay document/Image/canvas porque esto
// corre en Node, no en el browser. Devuelve el mismo formato de data URL
// que ya usa comprimirFoto() (data:image/jpeg;base64,...) para que el
// resultado sea intercambiable con lo que ya guarda FotoRecepcion.url.
async function descargarYComprimir(url) {
  const res = await fetchConTimeout(url, PHOTO_TIMEOUT_MS)
  if (!res.ok) throw new Error(`fetch foto: HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const comprimida = await sharp(buffer)
    .resize({ width: PHOTO_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: PHOTO_QUALITY })
    .toBuffer()
  return `data:image/jpeg;base64,${comprimida.toString('base64')}`
}

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

  let data
  try {
    const res = await fetchConTimeout(`${IDTAG_BASE_URL}/${encodeURIComponent(idtag)}`, TIMEOUT_MS)

    if (!res.ok) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    data = await res.json()

    // Kit inexistente en 918TAG -> 404 arriba. Kit existente pero nunca
    // activado -> 200 con solo {status:'INACTIVE'}, sin bike. Los dos casos
    // son "no hay datos para autocompletar" desde acá.
    if (!data?.bike) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
  } catch (error) {
    // Cubre timeout (AbortError), 918TAG caído, JSON inválido - cualquier
    // fallo upstream se traduce siempre a un "no encontrado" limpio, nunca
    // una excepción sin manejar hacia el form del taller.
    console.error('GET /api/tagmaker/[idtag]:', error.message)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Fotos: best-effort, completamente separado del resto. Si esto falla -
  // entero o foto por foto - el resto de los datos (marca, modelo, año,
  // color, services) se devuelve igual. Nunca tumba la respuesta completa.
  let photos = []
  try {
    const candidatas = Array.isArray(data.photos) ? data.photos.slice(0, MAX_PHOTOS) : []
    const resultados = await Promise.allSettled(candidatas.map(descargarYComprimir))
    photos = resultados
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)
    const fallidas = resultados.filter((r) => r.status === 'rejected')
    if (fallidas.length > 0) {
      console.error('GET /api/tagmaker/[idtag] (fotos, best-effort):', fallidas.map((r) => r.reason?.message))
    }
  } catch (error) {
    console.error('GET /api/tagmaker/[idtag] (fotos, fallo total):', error.message)
    photos = []
  }

  return NextResponse.json({
    brand:        data.bike.brand,
    model:        data.bike.model,
    year:         data.bike.year,
    color:        data.bike.color,
    serialNumber: data.bike.serialNumber,
    services:     data.services ?? [],
    photos,
  })
}
