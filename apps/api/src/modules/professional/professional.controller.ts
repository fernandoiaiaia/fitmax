import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProfessionalService } from './professional.service';

const createProfessionalSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const updateProfessionalSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export class ProfessionalController {
  private professionalService = new ProfessionalService();

  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const professionals = await this.professionalService.findAll();
      res.json(professionals);
    } catch (err) {
      next(err);
    }
  };

  /** GET /professionals/me — retorna perfil do profissional autenticado (OWASP A01) */
  findMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user!.sub; // sempre do JWT, nunca do body
      const professional = await this.professionalService.findByIdFull(id);
      res.json(professional);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const professional = await this.professionalService.findById(req.params.id);
      res.json(professional);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createProfessionalSchema.parse(req.body);
      const professional = await this.professionalService.create(dto);
      res.status(201).json(professional);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = updateProfessionalSchema.parse(req.body);
      const professional = await this.professionalService.update(req.params.id, dto);
      res.json(professional);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.professionalService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
