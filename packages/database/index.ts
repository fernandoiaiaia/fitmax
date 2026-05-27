// MUST be first — loads DATABASE_URL before anything else runs
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type PrismaClientType = InstanceType<typeof PrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined;
}

/**
 * Singleton PrismaClient.
 *
 * Prisma 7 uses the WASM "client" engine by default.
 * This requires a driver adapter (@prisma/adapter-pg) for PostgreSQL.
 * DATABASE_URL must be set in the environment (loaded by dotenv above).
 */
function makePrisma(): PrismaClientType {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClientType =
  globalThis.__prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
