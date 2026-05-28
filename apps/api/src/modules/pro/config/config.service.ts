import { prisma } from '@fitmax/database';
import bcrypt from 'bcryptjs';
import { logger } from '../../../lib/logger';

export class ConfigProService {
  async atualizarPerfil(profissionalId: string, dados: any, meta: { ip: string; userAgent: string }) {
    const prof = await prisma.professional.update({
      where: { id: profissionalId },
      data: {
        name: dados.name,
        email: dados.email,
        telefone: dados.telefone,
        username: dados.username,
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
}
