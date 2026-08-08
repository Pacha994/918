import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// POST es el endpoint de onboarding: se llama ANTES de que exista sesión
// (ver onboarding/page.js - crea el taller acá y recién después llama
// POST /api/auth/login), así que no puede exigir getTallerId(). El upsert
// busca por whatsapp (@unique en el schema, es el dato real que identifica
// a un taller en el form de onboarding) en vez de por un id fijo - así cada
// whatsapp nuevo crea un taller separado con id generado por Prisma, y
// reenviar el form con el mismo whatsapp actualiza ese taller en vez de
// pisar el de otro.
export async function POST(request) {
  try {
    const body = await request.json()
    const { nombre, whatsapp, servicios } = body

    if (!nombre || !whatsapp) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const taller = await prisma.taller.upsert({
      where:  { whatsapp },
      update: { nombre, servicios: sanitizarServicios(servicios || []) },
      create: { nombre, whatsapp, servicios: sanitizarServicios(servicios || []) },
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
