const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const existing = await db.taller.findFirst();
  if (existing) {
    console.log("Taller ya existe:", existing.id);
    return;
  }

  const taller = await db.taller.create({
    data: {
      nombre: "Taller 918",
      whatsapp: "5491100000000",
      servicios: {
        basico:      { precio: 8000,  items: ["Limpieza", "Lubricación cadena", "Ajuste frenos", "Ajuste cambios"] },
        completo:    { precio: 15000, items: ["Todo lo básico", "Centrado de ruedas", "Limpieza profunda", "Revisión rodamientos"] },
        premium:     { precio: 25000, items: ["Todo lo completo", "Cambio cables y fundas", "Revisión horquilla", "Informe detallado"] },
        diagnostico: { precio: 3000,  items: ["Revisión general", "Informe de estado", "Presupuesto de reparación"] },
      },
    },
  });

  console.log("Taller creado:", taller.id);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
