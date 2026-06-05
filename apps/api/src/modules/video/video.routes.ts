import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth';
import { logger } from '../../lib/logger';

import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

// LOG DE DIAGNÓSTICO — remove depois que funcionar
console.log('[VIDEO ROUTES] AGORA_APP_ID carregado:', process.env.AGORA_APP_ID?.substring(0, 8) + '...');
console.log('[VIDEO ROUTES] CERTIFICATE set?', !!process.env.AGORA_APP_CERTIFICATE);

const router = Router();

const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:       20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Muitas requisições de token. Aguarde 1 minuto.' },
});

const tokenQuerySchema = z.object({
  canal: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de canal inválido')
    .transform(v => v.replace(/-/g, '_'))
});

/**
 * GET /api/video/token?canal=:canal
 * Gera um RTC token (AccessToken v1) válido por 1 hora.
 * Requer JWT autenticado.
 */
router.get(
  '/token',
  authenticate,
  tokenLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = tokenQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({
          error: 'Parâmetros inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const appId          = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      if (!appId || !appCertificate) {
        logger.error(
          { event: 'video_token_config_missing' },
          'AGORA_APP_ID ou AGORA_APP_CERTIFICATE não configurados',
        );
        res.status(503).json({ error: 'Serviço de vídeo não configurado.' });
        return;
      }

      const { canal } = parsed.data;
      const userId = req.user!.sub;

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + 3600;

      // UID 0 allows any client to join and Agora will auto-assign a UID.
      const token: string = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        canal,
        0, 
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );

      // LOG DE DIAGNÓSTICO
      console.log('[TOKEN GERADO]', {
        appId: appId.substring(0, 8) + '...',
        canal,
        tokenInicio: token.substring(0, 30) + '...',
      });

      logger.info(
        { event: 'video_token_emitido', userId, canal, ip: req.ip },
        `Token RTC gerado para ${userId} no canal ${canal}`,
      );

      res.json({ token, appId, canal });
    } catch (err) {
      next(err);
    }
  },
);

export { router as videoRouter };
