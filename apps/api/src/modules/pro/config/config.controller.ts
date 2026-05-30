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

      // Pré-processa: converte strings vazias em null/undefined para campos opcionais
      const body = { ...req.body };
      if (body.telefone === '') body.telefone = null;
      if (body.username  === '') body.username  = null;
      if (body.uf        === '') body.uf        = undefined;
      if (body.cidade    === '') body.cidade    = undefined;

      const schema = z.object({
        name:                 z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim().optional(),
        email:                z.string().email('E-mail inválido').max(254).toLowerCase().trim().optional(),
        telefone:             z.string()
                               .regex(/^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/, 'Telefone inválido. Ex: (11) 99000-0000')
                               .optional()
                               .nullable(),
        username:             z.string()
                               .min(3, 'Username deve ter ao menos 3 caracteres')
                               .max(30)
                               .regex(/^[a-z0-9_]+$/, 'Username só pode conter letras minúsculas, números e _')
                               .optional()
                               .nullable(),
        especialidade:        z.string().optional(),
        registroProfissional: z.string().optional(),
        cidade:               z.string().optional(),
        uf:                   z.string().length(2, 'UF deve ter exatamente 2 caracteres').optional(),
        convenios:            z.array(z.string()).optional(),
      });

      const dados = schema.parse(body);

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
        novaSenha:  z.string().min(8),
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

  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
      }
      const result = await this.svc.uploadAvatar(profissionalId, req.file.path);
      res.json(result);
    } catch (err) { next(err); }
  };
}
