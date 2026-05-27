import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service';

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class AdminController {
  private adminService = new AdminService();

  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const admins = await this.adminService.findAll();
      res.json(admins);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = await this.adminService.findById(req.params.id);
      res.json(admin);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createAdminSchema.parse(req.body);
      const admin = await this.adminService.create(dto);
      res.status(201).json(admin);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.adminService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
