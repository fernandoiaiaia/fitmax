import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConfigProService } from './config.service';

export class ConfigProController {
  private svc = new ConfigProService();

  listarConvenios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const convenios = await this.svc.listarConvenios();
      res.json(convenios);
    } catch (err) { next(err); }
  };

  listarPlanos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planos = await this.svc.listarPlanos();
      res.json(planos);
    } catch (err) { next(err); }
  };

  atualizarPerfil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const schema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        username: z.string().optional(),
        especialidade: z.string().optional(),
        registroProfissional: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().length(2).optional(),
        convenios: z.array(z.string()).optional(),
      });
      const dados = schema.parse(req.body);

      const result = await this.svc.atualizarPerfil(
        profissionalId,
        dados,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  atualizarSenha = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const schema = z.object({
        senhaAtual: z.string(),
        novaSenha: z.string().min(8),
      });
      const { senhaAtual, novaSenha } = schema.parse(req.body);

      const result = await this.svc.atualizarSenha(
        profissionalId,
        senhaAtual,
        novaSenha,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  atualizarNotificacoes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const schema = z.object({
        notificacoes: z.record(z.boolean()),
      });
      const { notificacoes } = schema.parse(req.body);

      const result = await this.svc.atualizarNotificacoes(
        profissionalId,
        notificacoes,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  excluirConta = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const result = await this.svc.excluirConta(
        profissionalId,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  atualizarPlano = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const schema = z.object({
        plano: z.string().nullable(),
      });
      const { plano } = schema.parse(req.body);

      const result = await this.svc.atualizarPlano(
        profissionalId,
        plano,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };
}
