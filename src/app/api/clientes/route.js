import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TALLER_ID } from '@/lib/config'

export async function GET(request) {
  try {
    const wa = request.nextUrl.searchParams.get('whatsapp')?.trim()
    if (!wa) return NextResponse.json(null, { status: 400 })

    // Normalizar: buscar con y sin prefijo 54
    const candidatos = [wa, `54${wa}`, wa.replace(/^54/, '')]

    const cliente = await prisma.cliente.findFirst({
      where: { tallerId: TALLER_ID, whatsapp: { in: candidatos } },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('GET /api/clientes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
