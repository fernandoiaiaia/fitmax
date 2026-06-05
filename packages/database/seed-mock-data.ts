import { prisma } from './index';

async function main() {
  // 1. Obter os usuários recém-criados
  const prof = await prisma.professional.findUnique({ where: { email: 'profissional@fitmax.com.br' } });
  const client = await prisma.client.findUnique({ where: { email: 'paciente@fitmax.com.br' } });

  if (!prof || !client) {
    throw new Error("Usuários não encontrados. Rode o script de criação primeiro.");
  }

  // 2. Atualizar o perfil do Profissional
  await prisma.professional.update({
    where: { id: prof.id },
    data: {
      avatarUrl: 'https://i.pravatar.cc/150?u=prof',
      especialidade: 'Nutrição Esportiva',
      registroProfissional: 'CRN 12345/SP',
      telefone: '+5511999999999',
      cidade: 'São Paulo',
      uf: 'SP',
      convenios: ['Amil', 'Bradesco Saúde', 'SulAmérica'],
      cpf: '111.222.333-44',
      plano: 'Pro Anual'
    }
  });

  // 3. Atualizar o perfil do Cliente
  await prisma.client.update({
    where: { id: client.id },
    data: {
      avatarUrl: 'https://i.pravatar.cc/150?u=client',
      telefone: '+5511888888888',
      cpf: '555.666.777-88',
      objetivo: 'Hipertrofia',
      plano: 'Premium'
    }
  });

  // Limpar dados anteriores (para idempotência do script)
  await prisma.avaliacaoConsulta.deleteMany({ where: { clienteId: client.id } });
  await prisma.comentarioFeed.deleteMany({ where: { clienteId: client.id } });
  await prisma.curtidaFeed.deleteMany({ where: { clienteId: client.id } });
  await prisma.publicacao.deleteMany({ where: { profissionalId: prof.id } });
  await prisma.consulta.deleteMany({ where: { profissionalId: prof.id, clienteId: client.id } });
  await prisma.disponibilidade.deleteMany({ where: { profissionalId: prof.id } });

  // 4. Criar Disponibilidades para o profissional (Próximos dias)
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dateStr = futureDate.toISOString().split('T')[0];

    await prisma.disponibilidade.createMany({
      data: [
        { profissionalId: prof.id, dia: dateStr, hora: '09:00', modalidade: 'Online' },
        { profissionalId: prof.id, dia: dateStr, hora: '10:00', modalidade: 'Online' },
        { profissionalId: prof.id, dia: dateStr, hora: '14:00', modalidade: 'Online' }
      ]
    });
  }

  // 5. Criar Consultas (Diferentes status)
  // Consulta Concluída (Passado)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  const consultaConcluida = await prisma.consulta.create({
    data: {
      profissionalId: prof.id,
      clienteId: client.id,
      especialidade: 'Nutrição Esportiva',
      tipo: 'ONLINE',
      dataHora: pastDate,
      valorCentavos: 15000,
      status: 'PAGO',
      statusAgenda: 'CONCLUIDA'
    }
  });

  // Avaliação dessa consulta concluída
  await prisma.avaliacaoConsulta.create({
    data: {
      consultaId: consultaConcluida.id,
      clienteId: client.id,
      nota: 5,
      comentario: 'Excelente atendimento! Muito atencioso.'
    }
  });

  // Consulta Agendada (Futuro)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  await prisma.consulta.create({
    data: {
      profissionalId: prof.id,
      clienteId: client.id,
      especialidade: 'Nutrição Esportiva',
      tipo: 'ONLINE',
      dataHora: futureDate,
      valorCentavos: 15000,
      status: 'PAGO',
      statusAgenda: 'CONFIRMADA'
    }
  });

  // Consulta Cancelada
  await prisma.consulta.create({
    data: {
      profissionalId: prof.id,
      clienteId: client.id,
      especialidade: 'Nutrição Esportiva',
      tipo: 'ONLINE',
      dataHora: new Date(),
      valorCentavos: 15000,
      status: 'ESTORNO',
      statusAgenda: 'CANCELADA'
    }
  });

  // 6. Criar Publicações (Feed)
  const pub1 = await prisma.publicacao.create({
    data: {
      profissionalId: prof.id,
      topico: 'Dicas de Treino',
      caption: 'A importância de manter a hidratação durante o treino de hipertrofia! 💧💪 #FitMax #Saude',
      imagemUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
      aspectRatio: 1.0,
      likes: 1,
      comentarios: 1
    }
  });

  const pub2 = await prisma.publicacao.create({
    data: {
      profissionalId: prof.id,
      topico: 'Nutrição',
      caption: '5 alimentos para comer no pré-treino e ter mais energia! 🍌',
      imagemUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
      aspectRatio: 1.0,
      likes: 0,
      comentarios: 0
    }
  });

  // 7. Interações do Paciente com a Publicação do Profissional
  await prisma.curtidaFeed.create({
    data: {
      publicacaoId: pub1.id,
      clienteId: client.id
    }
  });

  await prisma.comentarioFeed.create({
    data: {
      publicacaoId: pub1.id,
      clienteId: client.id,
      texto: 'Ótima dica! Eu sempre esqueço de beber água 😅'
    }
  });

  console.log('Dados simulados (consultas, publicações, perfil, etc.) inseridos com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
