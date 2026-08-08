import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTallerId } from '@/lib/auth'

export async function GET(request) {
  try {
    const tallerId = await getTallerId()
    if (!tallerId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const wa = request.nextUrl.searchParams.get('whatsapp')?.trim()
    if (!wa) return NextResponse.json(null, { status: 400 })

    // Normalizar: buscar con y sin prefijo 54
    const candidatos = [wa, `54${wa}`, wa.replace(/^54/, '')]

    const cliente = await prisma.cliente.findFirst({
      where: { tallerId, whatsapp: { in: candidatos } },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('GET /api/clientes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
