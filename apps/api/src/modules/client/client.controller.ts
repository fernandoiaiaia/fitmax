import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ClientService } from './client.service';

const createClientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export class ClientController {
  private clientService = new ClientService();

  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const clients = await this.clientService.findAll();
      res.json(clients);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await this.clientService.findById(req.params.id);
      res.json(client);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createClientSchema.parse(req.body);
      const client = await this.clientService.create(dto);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = updateClientSchema.parse(req.body);
      const client = await this.clientService.update(req.params.id, dto);
      res.json(client);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.clientService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
