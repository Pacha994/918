import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

export async function GET() {
  try {
    const hoyUTC = new Date()
    hoyUTC.setUTCHours(0, 0, 0, 0)
    console.log('GET /api/bicis hoyUTC:', hoyUTC.toISOString())

    const bicis = await prisma.bici.findMany({
      where: {
        tallerId: TALLER_ID,
        OR: [
          { estado: { not: 'entregada' } },
          { estado: 'entregada', deliveredAt: { gte: hoyUTC } },
        ],
      },
      include: {
        cliente:   true,
        fotos:     true,
        hallazgos: true,
      },
      orderBy: { creadoEn: 'desc' }
    })
    console.log('GET /api/bicis resultado:', bicis.length, 'bicis')
    return NextResponse.json(bicis)
  } catch (error) {
    console.error('GET /api/bicis error:', error.message, error.code)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { cliente, bici, fotos } = body

    if (!cliente.whatsapp?.trim()) {
      return NextResponse.json({ error: 'WhatsApp requerido' }, { status: 400 })
    }

    const wa = cliente.whatsapp.trim()
    const candidatos = [wa, `54${wa}`, wa.replace(/^54/, '')]

    let clienteRecord = await prisma.cliente.findFirst({
      where: { tallerId: TALLER_ID, whatsapp: { in: candidatos } }
    })

    if (!clienteRecord) {
      clienteRecord = await prisma.cliente.create({
        data: {
          nombre:   cliente.nombre,
          whatsapp: wa,
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
