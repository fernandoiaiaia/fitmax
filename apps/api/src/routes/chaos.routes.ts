// apps/api/src/routes/chaos.routes.ts
import { Router } from 'express';
import { chaosState } from '../chaos';

const router = Router();

router.post('/chaos', (req, res) => {
  const { action, latencyMs } = req.body;

  console.log(`⚡ [Caos Control] Comando recebido: "${action}" (Latência: ${latencyMs || 0}ms)`);

  switch (action) {
    case 'disable-redis':
      chaosState.redisOffline = true;
      break;
    case 'enable-redis':
      chaosState.redisOffline = false;
      break;
    case 'simulate-db-latency':
      chaosState.dbLatencyMs = latencyMs || 2000;
      break;
    case 'restore-all':
      chaosState.redisOffline = false;
      chaosState.dbLatencyMs = 0;
      break;
    default:
      res.status(400).json({ error: 'Ação caótica inválida.' });
      return;
  }

  res.json({
    message: `Estado de caos atualizado: ${action}`,
    state: chaosState,
  });
});

export { router as chaosRouter };
