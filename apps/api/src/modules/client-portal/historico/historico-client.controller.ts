import { Request, Response, NextFunction } from 'express';
import {
  HistoricoClientService,
  listarHistoricoSchema,
  avaliarConsultaSchema,
} from './historico-client.service';

const service = new HistoricoClientService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrai IP real mesmo atrás de proxy (OWASP A09 — rastreabilidade). */
function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class HistoricoClientController {

  /**
   * GET /api/client-portal/historico
   * Lista as consultas realizadas do cliente com filtro de período e paginação.
   * OWASP A01 — clientId sempre do JWT
   * OWASP A03 — query params validados via Zod
   */
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clientId sempre do JWT, nunca da query
      const clientId = req.user!.sub;

      // OWASP A03 — valida e sanitiza query params
      const parsed = listarHistoricoSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Parâmetros inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await service.listar(clientId, parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/historico/resumo
   * Retorna as métricas do card de Resumo Geral (sidebar).
   * OWASP A01 — clientId sempre do JWT
   */
  resumo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clientId sempre do JWT
      const clientId = req.user!.sub;
      const result   = await service.resumo(clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/historico/timeline
   * Retorna as últimas 8 consultas para o widget de Linha do Tempo.
   * OWASP A01 — clientId sempre do JWT
   * OWASP A04 — limite fixo de 8 no service
   */
  timeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clientId sempre do JWT
      const clientId = req.user!.sub;
      const result   = await service.timeline(clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/historico/:id
   * Detalhe completo de uma consulta específica do histórico.
   * OWASP A01 — ownership verificado no service
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId   = req.user!.sub;
      const consultaId = req.params.id;

      const result = await service.findById(consultaId, clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/client-portal/historico/:id/avaliar
   * Cria ou atualiza a avaliação de uma consulta (1-5 ⭐).
   * OWASP A01 — ownership verificado no service
   * OWASP A03 — body validado via Zod
   * OWASP A04 — só aceita consultas com status PAGO
   * OWASP A08 — upsert garante idempotência
   */
  avaliar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId   = req.user!.sub;
      const consultaId = req.params.id;

      // OWASP A03 — valida body completo
      const parsed = avaliarConsultaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const meta   = { ip: getIp(req), userAgent: req.headers['user-agent'] ?? '' };
      const result = await service.avaliar(consultaId, clientId, parsed.data, meta);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}
