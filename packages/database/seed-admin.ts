/**
 * seed-admin.ts
 * Recria o primeiro usuário administrador após reset do banco.
 *
 * Uso:
 *   cd packages/database
 *   npx tsx seed-admin.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
  const email    = 'admin@fitmax.com';
  const password = 'Admin@123456';
  const name     = 'Administrador FitMax';

  const existente = await prisma.admin.findUnique({ where: { email } });
  if (existente) {
    console.log('⚠️  Admin já existe:', email);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.admin.create({ data: { email, password: hash, name } });

  console.log('');
  console.log('✅  Admin criado com sucesso!');
  console.log('');
  console.log('   📧  E-mail  :', email);
  console.log('   🔑  Senha   :', password);
  console.log('');
  console.log('   Acesse: http://localhost:3002');
  console.log('   Troque a senha após o primeiro login.');
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => pool.end()));
