import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

const sanitizarServicios = (arr) =>
  arr.map(s => ({ ...s, precio: Math.max(0, Number(s.precio) || 0) }))

export async function GET() {
  try {
    const taller = await prisma.taller.findUnique({
      where: { id: TALLER_ID },
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

export async function POST(request) {
  try {
    const body = await request.json()
    const { nombre, whatsapp, servicios } = body

    if (!nombre || !whatsapp) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existente = await prisma.taller.findUnique({
      where: { whatsapp },
    })

    let taller
    if (existente) {
      taller = await prisma.taller.update({
        where: { whatsapp },
        data: { nombre, servicios: sanitizarServicios(servicios || []) },
      })
    } else {
      taller = await prisma.taller.create({
        data: { nombre, whatsapp, servicios: sanitizarServicios(servicios || []) },
      })
    }

    return NextResponse.json(taller, { status: 201 })
  } catch (error) {
    console.error('POST /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { nombre, servicios } = body

    const data = {}
    if (nombre !== undefined) data.nombre = nombre.trim()
    if (servicios !== undefined) data.servicios = sanitizarServicios(servicios)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const taller = await prisma.taller.update({
      where: { id: TALLER_ID },
      data,
    })

    return NextResponse.json(taller)
  } catch (error) {
    console.error('PATCH /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
