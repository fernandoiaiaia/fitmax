import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';
import bcrypt from 'bcryptjs';

export interface CreateProfessionalDto {
  email: string;
  name: string;
  password: string;
}

export interface UpdateProfessionalDto {
  name?: string;
  email?: string;
}

export class ProfessionalService {
  async findAll() {
    return prisma.professional.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async findById(id: string) {
    const professional = await prisma.professional.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!professional) throw new AppError('Professional not found', 404);
    return professional;
  }

  /** Retorna perfil completo do profissional autenticado — para o endpoint /me */
  async findByIdFull(id: string) {
    const professional = await prisma.professional.findUnique({
      where: { id },
      select: {
        id:                   true,
        name:                 true,
        email:                true,
        avatarUrl:            true,
        especialidade:        true,
        registroProfissional: true,
        cidade:               true,
        uf:                   true,
        status:               true,
        // contagens para o sidebar
        _count: {
          select: {
            consultas: true, // total de consultas do profissional
          },
        },
      },
    });
    if (!professional) throw new AppError('Professional not found', 404);
    return professional;
  }

  async create(dto: CreateProfessionalDto) {
    const exists = await prisma.professional.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new AppError('Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    return prisma.professional.create({
      data: { email: dto.email, name: dto.name, password: hashed },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateProfessionalDto) {
    await this.findById(id);
    return prisma.professional.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await prisma.professional.delete({ where: { id } });
  }
}
