import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Prisma 7: datasourceUrl must be passed explicitly (removed from schema.prisma)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});


async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@fitmax.com';
  const adminPassword = 'Admin@123';

  const existing = await prisma.admin.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`⚠️  Admin já existe: ${adminEmail} — pulando.`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hash,
      },
    });
    console.log('✅ Admin criado:');
    console.log(`   📧 E-mail : ${adminEmail}`);
    console.log(`   🔑 Senha  : ${adminPassword}`);
  }

  console.log('\n✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
