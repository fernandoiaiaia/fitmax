import { Request, Response, NextFunction } from 'express';
import {
  ConsultasClientService,
  listarConsultasSchema,
  statsSchema,
  agendarConsultaSchema,
  cancelarConsultaSchema,
  reagendarConsultaSchema,
} from './consultas-client.service';

const service = new ConsultasClientService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrai IP real mesmo atrás de proxy (OWASP A09 — rastreabilidade). */
function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class ConsultasClientController {

  /**
   * GET /api/client-portal/consultas
   * Lista as consultas do cliente autenticado.
   */
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clientId sempre do JWT
      const clientId = req.user!.sub;

      // OWASP A03 — valida e sanitiza query params
      const parsed = listarConsultasSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await service.listar(clientId, parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/consultas/stats
   * Retorna os cards de resumo do período.
   */
  stats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clientId sempre do JWT
      const clientId = req.user!.sub;

      // OWASP A03 — valida query params
      const parsed = statsSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await service.stats(clientId, parsed.data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/consultas/:id
   * Detalhe de uma consulta específica.
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
   * POST /api/client-portal/consultas
   * Agenda uma nova consulta.
   */
  agendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;

      // OWASP A03 — valida body completo
      const parsed = agendarConsultaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const meta = { ip: getIp(req), userAgent: req.headers['user-agent'] ?? '' };
      const result = await service.agendar(clientId, parsed.data, meta);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/client-portal/consultas/:id/cancelar
   * Cancela uma consulta PENDENTE.
   */
  cancelar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId   = req.user!.sub;
      const consultaId = req.params.id;

      // OWASP A03 — motivo opcional mas validado
      const parsed = cancelarConsultaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const meta = { ip: getIp(req), userAgent: req.headers['user-agent'] ?? '' };
      const result = await service.cancelar(consultaId, clientId, parsed.data, meta);

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/client-portal/consultas/:id/reagendar
   * Reagenda uma consulta PENDENTE para nova data.
   */
  reagendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId   = req.user!.sub;
      const consultaId = req.params.id;

      // OWASP A03 — valida novaDataHora
      const parsed = reagendarConsultaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const meta = { ip: getIp(req), userAgent: req.headers['user-agent'] ?? '' };
      const result = await service.reagendar(consultaId, clientId, parsed.data, meta);

      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
