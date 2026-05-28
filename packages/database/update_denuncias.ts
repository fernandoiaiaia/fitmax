import { prisma } from '../../apps/api/src/lib/prisma';
async function main() {
  const result = await prisma.publicacao.updateMany({
    where: { denuncias: { some: {} }, status: 'ATIVA' },
    data: { status: 'DENUNCIADA' }
  });
  console.log('Atualizadas:', result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
