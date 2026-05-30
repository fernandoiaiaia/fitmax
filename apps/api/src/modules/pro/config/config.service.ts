import path from 'path';
import { prisma } from '@fitmax/database';
import bcrypt from 'bcryptjs';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';

export class ConfigProService {
  async listarConvenios() {
    return prisma.convenio.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, categoria: true },
    });
  }

  async listarPlanos() {
    const planos = await prisma.plano.findMany({
      where: { audiencia: 'PROFISSIONAL', ativo: true },
      orderBy: { valorCentavos: 'asc' },
    });

    return planos.map((p) => {
      // Formata o valor em R$ (ex: R$ 89,00 -> R$ 89, R$ 89,90 -> R$ 89,90)
      const valorStr = (p.valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      
      let periodoStr = "/mês";
      if (p.tipo === "TRIMESTRAL") periodoStr = "/trimestre";
      else if (p.tipo === "SEMESTRAL") periodoStr = "/semestre";
      else if (p.tipo === "ANUAL") periodoStr = "/ano";

      // Lógica provisória para definir cor, destaque e features baseado no nome
      const isPremium = p.nome.toLowerCase().includes('enterprise') || p.nome.toLowerCase().includes('premium');
      
      return {
        id: p.id,
        nome: p.nome,
        preco: `R$ ${valorStr}`,
        periodo: periodoStr,
        color: isPremium ? "#a78bfa" : "#10b981",
        ativo: p.ativo,
        destaque: !isPremium,
        features: isPremium 
          ? ["Tudo do Pro", "Multi-profissional", "Gerenciamento de equipe", "Integração via API"]
          : ["Consultas ilimitadas", "Agenda completa", "Feed completo", "Suporte prioritário"],
      };
    });
  }

  async atualizarPerfil(profissionalId: string, dados: any, meta: { ip: string; userAgent: string }) {
    const finalTelefone = dados.telefone === '' ? null : dados.telefone;
    const finalUsername = dados.username === '' ? null : dados.username;

    // Valida unicidade de username (OWASP A03)
    if (finalUsername) {
      const existente = await prisma.professional.findFirst({
        where: { username: finalUsername, id: { not: profissionalId } },
      });
      if (existente) throw new AppError(`Username "@${finalUsername}" já está em uso`, 409);
    }

    // Valida unicidade de email se enviado (OWASP A03)
    if (dados.email) {
      const existente = await prisma.professional.findFirst({
        where: { email: dados.email, id: { not: profissionalId } },
      });
      if (existente) throw new AppError('E-mail já está em uso', 409);
    }

    const prof = await prisma.professional.update({
      where: { id: profissionalId },
      data: {
        name: dados.name,
        email: dados.email,
        telefone: finalTelefone,
        username: finalUsername,
        especialidade: dados.especialidade,
        registroProfissional: dados.registroProfissional,
        cidade: dados.cidade,
        uf: dados.uf,
        convenios: dados.convenios,
      },
      select: {
        id: true, name: true, email: true, telefone: true, username: true,
        especialidade: true, registroProfissional: true, cidade: true, uf: true, convenios: true,
      }
    });

    logger.info({
      event: 'perfil_pro_atualizado',
      profissionalId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Perfil do profissional atualizado');

    return prof;
  }

  async atualizarSenha(profissionalId: string, senhaAtual: string, novaSenha: string, meta: { ip: string; userAgent: string }) {
    const prof = await prisma.professional.findUnique({
      where: { id: profissionalId },
      select: { password: true },
    });

    if (!prof) throw new Error('Profissional não encontrado');

    const isValid = await bcrypt.compare(senhaAtual, prof.password);
    if (!isValid) {
      logger.warn({
        event: 'tentativa_senha_invalida',
        profissionalId,
        ip: meta.ip,
        userAgent: meta.userAgent,
      }, 'Tentativa de alteração de senha com senha atual incorreta (OWASP A07)');
      throw new Error('Senha atual incorreta');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(novaSenha, salt);

    await prisma.professional.update({
      where: { id: profissionalId },
      data: { password: hash },
    });

    logger.info({
      event: 'senha_pro_atualizada',
      profissionalId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Senha do profissional atualizada com sucesso');

    return { sucesso: true };
  }

  async atualizarNotificacoes(profissionalId: string, notificacoes: any, meta: { ip: string; userAgent: string }) {
    const prof = await prisma.professional.update({
      where: { id: profissionalId },
      data: { notificacoes },
      select: { notificacoes: true }
    });

    logger.info({
      event: 'notificacoes_pro_atualizadas',
      profissionalId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Preferências de notificação atualizadas');

    return prof.notificacoes;
  }

  async excluirConta(profissionalId: string, meta: { ip: string; userAgent: string }) {
    await prisma.professional.update({
      where: { id: profissionalId },
      data: { status: 'INATIVO' },
    });

    logger.info({
      event: 'conta_pro_inativada',
      profissionalId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Conta do profissional inativada (Exclusão lógica solicitada)');

    return { sucesso: true };
  }

  async atualizarPlano(profissionalId: string, plano: string | null, meta: { ip: string; userAgent: string }) {
    const prof = await prisma.professional.update({
      where: { id: profissionalId },
      data: { plano },
      select: { plano: true }
    });

    logger.info({
      event: 'plano_pro_atualizado',
      profissionalId,
      plano,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Plano de assinatura do profissional atualizado');

    return { sucesso: true, plano: prof.plano };
  }

  /**
   * Salva o caminho do arquivo de avatar enviado via multer e atualiza o banco.
   */
  async uploadAvatar(profissionalId: string, filePath: string) {
    const avatarUrl = `/uploads/avatars/${path.basename(filePath)}`;
    const prof = await prisma.professional.update({
      where: { id: profissionalId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    logger.info({ event: 'avatar_pro_atualizado', profissionalId }, 'Avatar do profissional atualizado');
    return { avatarUrl: prof.avatarUrl };
  }
}
