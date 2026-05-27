import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AssinaturasService } from './assinaturas.service';

const service = new AssinaturasService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress
      ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

// ─── Schemas Zod (OWASP A03 — validação rigorosa de inputs) ──────────────────

const PERIODOS = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as const;

/**
 * Schema para criar plano.
 * - nome: 2–100 chars, sem espaços extras
 * - tipo: enum restrito
 * - valor: em reais (frontend envia reais, controller converte para centavos)
 * - consultas: 1–9999
 * - taxa: 0–100 %
 */
const criarPlanoSchema = z.object({
  nome:      z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  tipo:      z.enum(PERIODOS, { errorMap: () => ({ message: `tipo deve ser um de: ${PERIODOS.join(', ')}` }) }),
  valor:     z.number({ invalid_type_error: 'valor deve ser um número' }).positive('valor deve ser positivo').max(100_000, 'valor máximo: R$ 100.000'),
  consultas: z.number({ invalid_type_error: 'consultas deve ser um número' }).int().positive().max(9999),
  taxa:      z.number({ invalid_type_error: 'taxa deve ser um número' }).int().min(0).max(100),
});

/** Edição aceita qualquer subconjunto dos campos criáveis */
const editarPlanoSchema = criarPlanoSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Envie ao menos um campo para editar' }
);

/** UUID no parâmetro :id — OWASP A03 */
const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class AssinaturasController {

  /** GET /api/admin/assinaturas */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.list();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/assinaturas */
  criar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nome, tipo, valor, consultas, taxa } = criarPlanoSchema.parse(req.body);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);

      // Converte reais → centavos aqui (OWASP A02 — evita float no banco)
      const valorCentavos = Math.round(valor * 100);

      const plano = await service.criar({ nome, tipo, valorCentavos, consultas, taxa, adminId, ...meta });
      res.status(201).json(plano);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/admin/assinaturas/:id/toggle */
  toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);

      const plano = await service.toggle(id, adminId, meta.ip, meta.userAgent);
      res.json(plano);
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/admin/assinaturas/:id */
  editar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id }             = uuidParamSchema.parse(req.params);
      const campos             = editarPlanoSchema.parse(req.body);
      const adminId            = req.user!.sub;
      const meta               = getMeta(req);

      // Converte valor para centavos se enviado
      const valorCentavos = campos.valor !== undefined
        ? Math.round(campos.valor * 100)
        : undefined;

      const plano = await service.editar(id, {
        nome:      campos.nome,
        tipo:      campos.tipo,
        valorCentavos,
        consultas: campos.consultas,
        taxa:      campos.taxa,
        adminId,
        ...meta,
      });
      res.json(plano);
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /api/admin/assinaturas/:id */
  excluir = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);

      const result = await service.excluir(id, adminId, meta.ip, meta.userAgent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
