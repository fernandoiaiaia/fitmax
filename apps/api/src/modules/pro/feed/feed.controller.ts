import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FeedProService, criarPublicacaoSchema, comentarSchema } from './feed.service';

const paginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
});

export class FeedProController {
  private svc = new FeedProService();

  /** GET /api/pro/feed */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { page, limit, search } = paginationSchema.parse(req.query);
      const result = await this.svc.list(profissionalId, page, limit, search);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/feed/minhas */
  listMinhas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { page, limit } = paginationSchema.parse(req.query);
      const result = await this.svc.listMinhas(profissionalId, page, limit);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** POST /api/pro/feed */
  criar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const dto = criarPublicacaoSchema.parse(req.body);
      const result = await this.svc.criar(
        profissionalId, dto,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  /** DELETE /api/pro/feed/:id */
  deletar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const result = await this.svc.deletar(
        profissionalId, req.params.id,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** POST /api/pro/feed/:id/curtir — toggle curtida */
  curtir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const result = await this.svc.toggleCurtir(
        profissionalId, req.params.id,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** POST /api/pro/feed/:id/comentar */
  comentar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { texto } = comentarSchema.parse(req.body);
      const result = await this.svc.comentar(
        profissionalId, req.params.id, texto,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/feed/:id/comentarios */
  listarComentarios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const result = await this.svc.listarComentarios(req.params.id, page, limit);
      res.json(result);
    } catch (err) { next(err); }
  };
}
