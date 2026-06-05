const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.consulta.updateMany({
    where: { dataHora: new Date("2026-06-03T20:00:00.000Z") },
    data: { dataHora: new Date("2026-06-03T17:00:00.000Z") }
  });
  console.log("Fixed!");
}
run();
