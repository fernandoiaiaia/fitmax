import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import bcrypt from 'bcryptjs';

export interface CreateClientDto {
  email: string;
  name: string;
  password: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
}

export class ClientService {
  async findAll() {
    return prisma.client.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async findById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!client) throw new AppError('Client not found', 404);
    return client;
  }

  async create(dto: CreateClientDto) {
    const exists = await prisma.client.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new AppError('Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    return prisma.client.create({
      data: { email: dto.email, name: dto.name, password: hashed },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findById(id);
    return prisma.client.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await prisma.client.delete({ where: { id } });
  }
}
