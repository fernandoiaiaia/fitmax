import { prisma } from './index';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('Wawa3041@', 10);

  await prisma.admin.upsert({
    where: { email: 'admin@fitmax.com.br' },
    update: { password: passwordHash },
    create: {
      email: 'admin@fitmax.com.br',
      name: 'Administrador Geral',
      password: passwordHash,
      username: 'admin_master',
    },
  });

  console.log('Admin user created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
