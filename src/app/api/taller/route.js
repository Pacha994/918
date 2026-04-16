import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { nombre, whatsapp, servicios } = body

    if (!nombre || !whatsapp) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Para la demo: si ya existe un taller con ese whatsapp, actualizarlo
    const existente = await prisma.taller.findUnique({
      where: { whatsapp }
    })

    let taller
    if (existente) {
      taller = await prisma.taller.update({
        where: { whatsapp },
        data:  { nombre, servicios: servicios || [] }
      })
    } else {
      taller = await prisma.taller.create({
        data: { nombre, whatsapp, servicios: servicios || [] }
      })
    }

    return NextResponse.json(taller, { status: 201 })
  } catch (error) {
    console.error('POST /api/taller:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
