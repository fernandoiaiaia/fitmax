import { prisma as _prisma } from '@fitmax/database';

/**
 * Re-export the shared PrismaClient singleton from @fitmax/database.
 * Use this instance everywhere inside the API.
 */
export const prisma = _prisma;
