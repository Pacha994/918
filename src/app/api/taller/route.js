import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'
import { getTallerId } from '@/lib/auth'

const sanitizarServicios = (arr) =>
  arr.map(s => ({ ...s, precio: Math.max(0, Number(s.precio) || 0) }))

export async function GET() {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const taller = await prisma.taller.findUnique({
      where: { id: tallerId },
    })
    if (!taller) {
      return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 })
    }
    return NextResponse.json(taller)
  } catch (error) {
    console.error('GET /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST no se toca en este cambio: es el endpoint de onboarding, se llama
// ANTES de que exista sesión (ver onboarding/page.js - crea el taller acá
// y recién después llama POST /api/auth/login). Exigir sesión acá rompería
// el onboarding por completo. Sigue con TALLER_ID hardcoded a propósito -
// upsertear contra un id fijo en vez de crear un taller nuevo de verdad es
// un bug real y distinto (todo onboarding nuevo pisa el mismo registro),
// pero no es parte de este cambio - queda para revisar aparte.
export async function POST(request) {
  try {
    const body = await request.json()
    const { nombre, whatsapp, servicios } = body

    if (!nombre || !whatsapp) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const taller = await prisma.taller.upsert({
      where:  { id: TALLER_ID },
      update: { nombre, whatsapp, servicios: sanitizarServicios(servicios || []) },
      create: { id: TALLER_ID, nombre, whatsapp, servicios: sanitizarServicios(servicios || []) },
    })

    return NextResponse.json(taller, { status: 201 })
  } catch (error) {
    console.error('POST /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { nombre, servicios } = body

    const data = {}
    if (nombre !== undefined) data.nombre = nombre.trim()
    if (servicios !== undefined) data.servicios = sanitizarServicios(servicios)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const taller = await prisma.taller.update({
      where: { id: tallerId },
      data,
    })

    return NextResponse.json(taller)
  } catch (error) {
    console.error('PATCH /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
