import { prisma } from './src/lib/prisma';
prisma.professional.deleteMany({ where: { email: 'joão@gmail.com' } })
  .then(() => console.log('User deleted'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
