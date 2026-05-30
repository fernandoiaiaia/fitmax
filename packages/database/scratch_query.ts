import { prisma } from './index';

async function main() {
  console.log("=== CLIENTS ===");
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, email: true }
  });
  console.log(clients);

  console.log("=== PROFESSIONALS ===");
  const pros = await prisma.professional.findMany({
    select: { id: true, name: true, email: true, registroProfissional: true }
  });
  console.log(pros);

  const ana = pros.find(p => p.name.includes("Ana"));
  if (ana) {
    console.log(`=== AVAILABILITIES FOR ${ana.name} ===`);
    const disps = await prisma.disponibilidade.findMany({
      where: { profissionalId: ana.id },
      orderBy: { dia: 'asc' }
    });
    console.log(disps);

    console.log(`=== APPOINTMENTS FOR ${ana.name} ===`);
    const appointments = await prisma.consulta.findMany({
      where: { profissionalId: ana.id },
      include: {
        cliente: { select: { name: true } }
      },
      orderBy: { dataHora: 'asc' }
    });
    console.log(appointments);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
