// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TALLER_ID = 'cmo1pymo80000v58afkeey7so'

// ─── Datos mock ────────────────────────────────────────────────────────────────

const clientes = [
  { nombre: 'Lucía Fernández',   whatsapp: '5491122334455' },
  { nombre: 'Matías Romero',     whatsapp: '5491133445566' },
  { nombre: 'Sofía Gutiérrez',   whatsapp: '5491144556677' },
  { nombre: 'Nicolás Pereyra',   whatsapp: '5491155667788' },
  { nombre: 'Valentina Castro',  whatsapp: '5491166778899' },
  { nombre: 'Diego Morales',     whatsapp: '5491177889900' },
  { nombre: 'Camila Torres',     whatsapp: '5491188990011' },
  { nombre: 'Facundo Ríos',      whatsapp: '5491199001122' },
]

const modelos = [
  { marca: 'Trek',        modelo: 'Marlin 5',         color: 'Azul mate'     },
  { marca: 'Specialized', modelo: 'Rockhopper Comp',  color: 'Negro'         },
  { marca: 'Giant',       modelo: 'Talon 3',          color: 'Rojo'          },
  { marca: 'Trek',        modelo: 'FX 3',             color: 'Gris perla'    },
  { marca: 'Orbea',       modelo: 'MX 50',            color: 'Verde oliva'   },
  { marca: 'Scott',       modelo: 'Aspect 950',       color: 'Blanco'        },
  { marca: 'Giant',       modelo: 'Escape 3',         color: 'Azul marino'   },
  { marca: 'Specialized', modelo: 'Crosstrail Sport', color: 'Naranja'       },
]

const tiposServicio = ['basico', 'completo', 'premium', 'diagnostico']

const problemasPool = [
  'Frenos no responden bien',
  'Cambios saltando',
  'Ruido en el pedalier',
  'Llanta pinchada',
  'Manubrio flojo',
  'Cadena desgastada',
  'Horquilla con juego',
  'Sillín roto',
  'Luz delantera sin funcionar',
  'Goma trasera gastada',
]

const hallazgosPool = [
  { descripcion: 'Cable de freno trasero deshilachado',       precio: 3500  },
  { descripcion: 'Pastillas de freno desgastadas (par)',       precio: 4800  },
  { descripcion: 'Cadena con estiramiento excesivo',           precio: 6200  },
  { descripcion: 'Piñón trasero con dientes rotos',            precio: 8500  },
  { descripcion: 'Rodamiento del pedalier seco',               precio: 5500  },
  { descripcion: 'Buje trasero con juego lateral',             precio: 9000  },
  { descripcion: 'Llanta delantera doblada levemente',         precio: 7500  },
  { descripcion: 'Shifter derecho sin clic definido',          precio: 11000 },
  { descripcion: 'Tubular trasero con corte pequeño',          precio: 4200  },
  { descripcion: 'Horquilla con fisura en soldadura inferior', precio: 18000 },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function horasAtras(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}

function diasAtras(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}

function randomProblemas() {
  return pickN(problemasPool, Math.floor(Math.random() * 2) + 1)
}

// ─── Bicis por estado ──────────────────────────────────────────────────────────

async function crearBici({ clienteId, estado, modelo, tipoServicio, creadoEn, deliveredAt, hallazgos: halls }) {
  const bici = await prisma.bici.create({
    data: {
      modelo:      `${modelo.marca} ${modelo.modelo}`,
      color:       modelo.color,
      estado,
      tipoServicio,
      problemas:   randomProblemas(),
      notas:       Math.random() > 0.6 ? 'Cliente deja hasta el viernes.' : null,
      creadoEn,
      deliveredAt: deliveredAt || null,
      clienteId,
      tallerId:    TALLER_ID,
    },
  })

  // Historial base
  await prisma.eventoHistorial.create({
    data: {
      tipo:        'ingreso',
      descripcion: 'Bici ingresada al taller',
      creadoEn,
      biciId: bici.id,
    },
  })

  // Hallazgos
  for (const h of halls) {
    const respondidoEn = h.estado !== 'pendiente'
      ? new Date(creadoEn.getTime() + 2 * 60 * 60 * 1000)
      : null

    await prisma.hallazgo.create({
      data: {
        descripcion:  h.descripcion,
        precio:       h.precio,
        fotoUrl:      'https://placehold.co/400x300/1a1a1a/666?text=foto',
        estado:       h.estado,
        creadoEn:     new Date(creadoEn.getTime() + 60 * 60 * 1000),
        respondidoEn,
        biciId:       bici.id,
      },
    })
  }

  return bici
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpiar datos previos del taller (en orden por FK)
  await prisma.eventoHistorial.deleteMany({ where: { bici: { tallerId: TALLER_ID } } })
  await prisma.hallazgo.deleteMany({        where: { bici: { tallerId: TALLER_ID } } })
  await prisma.fotoRecepcion.deleteMany({   where: { bici: { tallerId: TALLER_ID } } })
  await prisma.bici.deleteMany({            where: { tallerId: TALLER_ID } })
  await prisma.cliente.deleteMany({         where: { tallerId: TALLER_ID } })

  console.log('🗑️  Datos anteriores eliminados')

  // Crear clientes
  const clientesCreados = []
  for (const c of clientes) {
    const cliente = await prisma.cliente.create({
      data: { ...c, tallerId: TALLER_ID },
    })
    clientesCreados.push(cliente)
  }
  console.log(`👥 ${clientesCreados.length} clientes creados`)

  // ── INGRESADAS (2 bicis, recientes) ─────────────────────────────────────────
  await crearBici({
    clienteId:    clientesCreados[0].id,
    estado:       'ingresada',
    modelo:       modelos[0],
    tipoServicio: 'completo',
    creadoEn:     horasAtras(2),
    hallazgos:    [],
  })

  await crearBici({
    clienteId:    clientesCreados[1].id,
    estado:       'ingresada',
    modelo:       modelos[4],
    tipoServicio: 'diagnostico',
    creadoEn:     horasAtras(5),
    hallazgos:    [],
  })

  // ── DIAGNÓSTICO (2 bicis, con hallazgos pendientes) ──────────────────────────
  await crearBici({
    clienteId:    clientesCreados[2].id,
    estado:       'diagnostico',
    modelo:       modelos[1],
    tipoServicio: 'premium',
    creadoEn:     horasAtras(24),
    hallazgos:    [
      { ...hallazgosPool[0], estado: 'pendiente' },
      { ...hallazgosPool[4], estado: 'pendiente' },
    ],
  })

  await crearBici({
    clienteId:    clientesCreados[3].id,
    estado:       'diagnostico',
    modelo:       modelos[6],
    tipoServicio: 'basico',
    creadoEn:     horasAtras(30),
    hallazgos:    [
      { ...hallazgosPool[8], estado: 'pendiente' },
    ],
  })

  // ── REPARACIÓN (2 bicis, hallazgos aprobados y uno rechazado) ────────────────
  await crearBici({
    clienteId:    clientesCreados[4].id,
    estado:       'reparacion',
    modelo:       modelos[2],
    tipoServicio: 'completo',
    creadoEn:     horasAtras(48),
    hallazgos:    [
      { ...hallazgosPool[1], estado: 'aprobado'  },
      { ...hallazgosPool[2], estado: 'aprobado'  },
      { ...hallazgosPool[9], estado: 'rechazado' },
    ],
  })

  await crearBici({
    clienteId:    clientesCreados[5].id,
    estado:       'reparacion',
    modelo:       modelos[7],
    tipoServicio: 'premium',
    creadoEn:     horasAtras(60),
    hallazgos:    [
      { ...hallazgosPool[5], estado: 'aprobado' },
      { ...hallazgosPool[6], estado: 'aprobado' },
    ],
  })

  // ── LISTA (2 bicis, todo resuelto) ───────────────────────────────────────────
  await crearBici({
    clienteId:    clientesCreados[6].id,
    estado:       'lista',
    modelo:       modelos[3],
    tipoServicio: 'basico',
    creadoEn:     horasAtras(72),
    hallazgos:    [
      { ...hallazgosPool[3], estado: 'aprobado' },
    ],
  })

  await crearBici({
    clienteId:    clientesCreados[7].id,
    estado:       'lista',
    modelo:       modelos[5],
    tipoServicio: 'completo',
    creadoEn:     horasAtras(96),
    hallazgos:    [
      { ...hallazgosPool[7], estado: 'aprobado'  },
      { ...hallazgosPool[8], estado: 'rechazado' },
    ],
  })

  // ── ENTREGADA HOY (visible en kanban hasta medianoche) ───────────────────────
  await crearBici({
    clienteId:    clientesCreados[0].id,
    estado:       'entregada',
    modelo:       modelos[3],
    tipoServicio: 'basico',
    creadoEn:     horasAtras(100),
    deliveredAt:  horasAtras(3),
    hallazgos:    [
      { ...hallazgosPool[2], estado: 'aprobado' },
    ],
  })

  // ── ENTREGADAS AYER Y ANTES (visibles en historial) ──────────────────────────
  await crearBici({
    clienteId:    clientesCreados[1].id,
    estado:       'entregada',
    modelo:       modelos[5],
    tipoServicio: 'completo',
    creadoEn:     diasAtras(5),
    deliveredAt:  diasAtras(2),
    hallazgos:    [
      { ...hallazgosPool[3], estado: 'aprobado'  },
      { ...hallazgosPool[7], estado: 'rechazado' },
    ],
  })

  await crearBici({
    clienteId:    clientesCreados[2].id,
    estado:       'entregada',
    modelo:       modelos[0],
    tipoServicio: 'premium',
    creadoEn:     diasAtras(10),
    deliveredAt:  diasAtras(7),
    hallazgos:    [
      { ...hallazgosPool[0], estado: 'aprobado' },
      { ...hallazgosPool[6], estado: 'aprobado' },
    ],
  })

  console.log('✅ Seed completo — 11 bicis (8 activas + 1 entregada hoy + 2 en historial)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
