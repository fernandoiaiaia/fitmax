import './config/env'; // Validate env vars first — exits on failure
import { app } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './config/redis';
import { startEmailWorker } from './jobs/workers/email.worker';

async function bootstrap() {
  // ─── Start background workers ────────────────────────────────────────────
  startEmailWorker();
  logger.info('✅ BullMQ workers started');

  // ─── Start HTTP server ───────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 FitMax API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      logger.info('All connections closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
