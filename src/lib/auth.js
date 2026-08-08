import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = '918_session'

// Única fuente de verdad de "quién está logueado". La cookie 918_session
// guarda el id del Taller en texto plano (ver POST /api/auth/login) — acá
// además se valida contra la DB para no confiar ciegamente en el valor de
// la cookie (un taller borrado/re-seedeado con otro id no debe autenticar).
export async function getTallerId() {
  const cookieStore = await cookies()
  const tallerId = cookieStore.get(COOKIE_NAME)?.value
  if (!tallerId) return null

  const taller = await prisma.taller.findUnique({
    where:  { id: tallerId },
    select: { id: true },
  })

  return taller?.id ?? null
}
