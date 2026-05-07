// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TALLER_ID = 'cmo1pymo80000v58afkeey7so'

// ─── Pools ────────────────────────────────────────────────────────────────────

const CLIENTES_POOL = [
  { nombre: 'Lucía Fernández',   whatsapp: '5491122334455' },
  { nombre: 'Matías Romero',     whatsapp: '5491133445566' },
  { nombre: 'Sofía Gutiérrez',   whatsapp: '5491144556677' },
  { nombre: 'Nicolás Pereyra',   whatsapp: '5491155667788' },
  { nombre: 'Valentina Castro',  whatsapp: '5491166778899' },
  { nombre: 'Diego Morales',     whatsapp: '5491177889900' },
  { nombre: 'Camila Torres',     whatsapp: '5491188990011' },
  { nombre: 'Facundo Ríos',      whatsapp: '5491199001122' },
  { nombre: 'Paula Mendez',      whatsapp: '5491211223344' },
  { nombre: 'Sebastián Cruz',    whatsapp: '5491222334455' },
  { nombre: 'Marina Aguirre',    whatsapp: '5491233445566' },
  { nombre: 'Gonzalo Pérez',     whatsapp: '5491244556677' },
  { nombre: 'Florencia Vidal',   whatsapp: '5491255667788' },
  { nombre: 'Tomás Herrera',     whatsapp: '5491266778899' },
  { nombre: 'Cecilia Bravo',     whatsapp: '5491277889900' },
]

const MODELOS_POOL = [
  'Trek Marlin 5', 'Trek FX 3', 'Trek Domane AL 2',
  'Specialized Rockhopper Comp', 'Specialized Crosstrail Sport',
  'Giant Talon 3', 'Giant Escape 3', 'Giant Contend AR 3',
  'Orbea MX 50', 'Orbea Arra 30',
  'Scott Aspect 950', 'Scott Speedster 30',
  'Cannondale Trail 7', 'Cannondale Topstone 4',
  'Merida Big Nine 20',
]

const TIPOS_SERVICIO_HISTORIAL = [
  'Servicio completo',
  'Frenos',
  'Transmisión',
  'Suspensión',
  'Ruedas',
  'Limpieza',
]

const TIPOS_SERVICIO_KANBAN = ['basico', 'completo', 'premium', 'diagnostico']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function entre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function fechaEnRango(inicio, fin) {
  if (fin <= inicio) return new Date(inicio)
  return new Date(inicio.getTime() + Math.random() * (fin.getTime() - inicio.getTime()))
}

// Rango UTC de un mes. mesesAtras=0 → mes actual (hasta ayer); mesesAtras=1 → mes anterior completo.
function rangoMes(mesesAtras, hoyMidnightUTC) {
  const inicio = new Date(hoyMidnightUTC)
  inicio.setUTCDate(1)
  inicio.setUTCMonth(inicio.getUTCMonth() - mesesAtras)

  let fin
  if (mesesAtras === 0) {
    fin = new Date(hoyMidnightUTC.getTime() - 1) // 23:59:59.999 de ayer UTC
  } else {
    fin = new Date(inicio)
    fin.setUTCMonth(fin.getUTCMonth() + 1) // primer día del mes siguiente
    fin.setTime(fin.getTime() - 1)          // último ms del mes
  }

  return { inicio, fin }
}

// ─── Creadores ────────────────────────────────────────────────────────────────

async function crearServicioCerrado({ clienteId, deliveredAt }) {
  const diasEnTaller = entre(2, 7)
  const creadoEn = new Date(deliveredAt.getTime() - diasEnTaller * 24 * 60 * 60 * 1000)
  return prisma.bici.create({
    data: {
      modelo:       pick(MODELOS_POOL),
      estado:       'entregada',
      tipoServicio: pick(TIPOS_SERVICIO_HISTORIAL),
      precio:       entre(30, 120) * 1000,
      problemas:    [],
      creadoEn,
      deliveredAt,
      clienteId,
      tallerId: TALLER_ID,
    },
  })
}

async function crearBiciActiva({ clienteId, estado, horasAtras }) {
  return prisma.bici.create({
    data: {
      modelo:       pick(MODELOS_POOL),
      estado,
      tipoServicio: pick(TIPOS_SERVICIO_KANBAN),
      problemas:    [],
      creadoEn:     new Date(Date.now() - horasAtras * 3600000),
      clienteId,
      tallerId: TALLER_ID,
    },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...')

  await prisma.eventoHistorial.deleteMany({ where: { bici: { tallerId: TALLER_ID } } })
  await prisma.hallazgo.deleteMany({        where: { bici: { tallerId: TALLER_ID } } })
  await prisma.fotoRecepcion.deleteMany({   where: { bici: { tallerId: TALLER_ID } } })
  await prisma.bici.deleteMany({            where: { tallerId: TALLER_ID } })
  await prisma.cliente.deleteMany({         where: { tallerId: TALLER_ID } })
  console.log('🗑️  Datos anteriores eliminados')

  const clientesCreados = []
  for (const c of CLIENTES_POOL) {
    const cliente = await prisma.cliente.create({ data: { ...c, tallerId: TALLER_ID } })
    clientesCreados.push(cliente)
  }
  console.log(`👥 ${clientesCreados.length} clientes creados`)

  // ── Kanban activo ─────────────────────────────────────────────────────────
  await crearBiciActiva({ clienteId: clientesCreados[0].id, estado: 'ingresada',   horasAtras: 2  })
  await crearBiciActiva({ clienteId: clientesCreados[1].id, estado: 'ingresada',   horasAtras: 5  })
  await crearBiciActiva({ clienteId: clientesCreados[2].id, estado: 'diagnostico', horasAtras: 24 })
  await crearBiciActiva({ clienteId: clientesCreados[3].id, estado: 'diagnostico', horasAtras: 30 })
  await crearBiciActiva({ clienteId: clientesCreados[4].id, estado: 'reparacion',  horasAtras: 48 })
  await crearBiciActiva({ clienteId: clientesCreados[5].id, estado: 'reparacion',  horasAtras: 60 })
  await crearBiciActiva({ clienteId: clientesCreados[6].id, estado: 'lista',       horasAtras: 72 })
  await crearBiciActiva({ clienteId: clientesCreados[7].id, estado: 'lista',       horasAtras: 96 })

  // Entregada hoy (visible en kanban hasta medianoche)
  await prisma.bici.create({
    data: {
      modelo:       pick(MODELOS_POOL),
      estado:       'entregada',
      tipoServicio: 'Servicio completo',
      precio:       entre(30, 120) * 1000,
      problemas:    [],
      creadoEn:     new Date(Date.now() - 4 * 24 * 3600000),
      deliveredAt:  new Date(Date.now() - 3 * 3600000),
      clienteId:    clientesCreados[8].id,
      tallerId: TALLER_ID,
    },
  })
  console.log('✅ 9 bicis en kanban (8 activas + 1 entregada hoy)')

  // ── Historial: 4 meses ────────────────────────────────────────────────────
  const hoyMidnightUTC = new Date()
  hoyMidnightUTC.setUTCHours(0, 0, 0, 0)

  let totalCerradas = 0

  for (let mesesAtras = 0; mesesAtras <= 3; mesesAtras++) {
    const { inicio, fin } = rangoMes(mesesAtras, hoyMidnightUTC)

    if (fin <= inicio) {
      console.log(`  ⚠️  Mes ${mesesAtras} sin rango válido, omitiendo`)
      continue
    }

    const cantidad = mesesAtras === 0 ? entre(8, 12) : entre(15, 25)

    for (let i = 0; i < cantidad; i++) {
      const deliveredAt = fechaEnRango(inicio, fin)
      // Recurrencia: 40% de chances de reusar un cliente de los primeros 8
      const clienteIdx = Math.random() < 0.4
        ? entre(0, 7)
        : entre(0, clientesCreados.length - 1)
      await crearServicioCerrado({ clienteId: clientesCreados[clienteIdx].id, deliveredAt })
      totalCerradas++
    }

    const refDate = new Date(hoyMidnightUTC)
    refDate.setUTCMonth(refDate.getUTCMonth() - mesesAtras)
    const mesLabel = refDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    console.log(`  📅 ${mesLabel}: ${cantidad} servicios cerrados`)
  }

  console.log(`✅ Seed completo — ${totalCerradas} servicios en historial`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
