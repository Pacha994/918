const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const taller = await prisma.taller.upsert({
    where: { whatsapp: '3513169949' },
    update: {},
    create: {
      nombre:   'SG Bikes',
      whatsapp: '3513169949',
    },
  })
  console.log('Taller creado:', taller.id, taller.nombre)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
