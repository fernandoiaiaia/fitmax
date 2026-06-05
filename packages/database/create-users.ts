import { prisma } from './index';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('Wawa3041@', 10);

  await prisma.professional.upsert({
    where: { email: 'profissional@fitmax.com.br' },
    update: { password: passwordHash },
    create: {
      email: 'profissional@fitmax.com.br',
      name: 'Profissional FitMax',
      password: passwordHash,
      username: 'profissional_fitmax',
      status: 'ATIVO',
    },
  });

  await prisma.client.upsert({
    where: { email: 'paciente@fitmax.com.br' },
    update: { password: passwordHash },
    create: {
      email: 'paciente@fitmax.com.br',
      name: 'Paciente FitMax',
      password: passwordHash,
      username: 'paciente_fitmax',
      status: 'ATIVO',
    },
  });

  console.log('Users created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
