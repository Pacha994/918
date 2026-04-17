import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

export async function GET() {
  try {
    const bicis = await prisma.bici.findMany({
      where: {
        tallerId: TALLER_ID,
        estado: { not: 'entregada' }
      },
      include: {
        cliente:   true,
        fotos:     true,
        hallazgos: true,
      },
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(bicis)
  } catch (error) {
    console.error('GET /api/bicis:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { cliente, bici, fotos } = body

    let clienteRecord = await prisma.cliente.findUnique({
      where: {
        whatsapp_tallerId: {
          whatsapp: cliente.whatsapp || '',
          tallerId: TALLER_ID
        }
      }
    })

    if (!clienteRecord) {
      clienteRecord = await prisma.cliente.create({
        data: {
          nombre:   cliente.nombre,
          whatsapp: cliente.whatsapp || '',
          tallerId: TALLER_ID,
        }
      })
    }

    const nuevaBici = await prisma.bici.create({
      data: {
        modelo:       bici.modelo,
        color:        bici.color       || null,
        tipoServicio: bici.tipoServicio || null,
        notas:        bici.notas       || null,
        problemas:    bici.problemas   || [],
        estado:       'ingresada',
        clienteId:    clienteRecord.id,
        tallerId:     TALLER_ID,
        fotos: fotos && fotos.length > 0
          ? { create: fotos.map(f => ({ url: f.url, angulo: f.angulo || 'general' })) }
          : undefined
      },
      include: { cliente: true, fotos: true, hallazgos: true }
    })

    return NextResponse.json(nuevaBici, { status: 201 })
  } catch (error) {
    console.error('POST /api/bicis:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
