import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import bcrypt from 'bcryptjs';

export interface CreateAdminDto {
  email: string;
  password: string;
}

export class AdminService {
  async findAll() {
    return prisma.admin.findMany({
      select: { id: true, email: true, createdAt: true },
    });
  }

  async findById(id: string) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, createdAt: true },
    });
    if (!admin) throw new AppError('Admin not found', 404);
    return admin;
  }

  async create(dto: CreateAdminDto) {
    const exists = await prisma.admin.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new AppError('Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    return prisma.admin.create({
      data: { email: dto.email, password: hashed },
      select: { id: true, email: true, createdAt: true },
    });
  }

  async delete(id: string) {
    await this.findById(id); // ensures existence
    await prisma.admin.delete({ where: { id } });
  }
}
