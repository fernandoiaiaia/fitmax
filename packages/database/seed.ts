import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: url })) });


async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@fitmax.com';
  const adminPassword = 'Admin@123';
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`⚠️  Admin já existe: ${adminEmail} — pulando.`);
  } else {
    await prisma.admin.create({
      data: { email: adminEmail, password: await bcrypt.hash(adminPassword, 12), name: 'Admin FitMax' },
    });
    console.log(`✅ Admin criado: ${adminEmail} / ${adminPassword}`);
  }

  // ─── Profissionais de Teste ───────────────────────────────────────────────
  const profSenha = 'Pro@123456';
  const profHash  = await bcrypt.hash(profSenha, 12);

  const profissionais = [
    { email: 'ana.souza@fitmax.com',      name: 'Dra. Ana Souza',       especialidade: 'Nutrição',           cidade: 'São Paulo',      uf: 'SP', avatarUrl: 'https://picsum.photos/200/200?random=23' },
    { email: 'roberto.alves@fitmax.com',  name: 'Dr. Roberto Alves',    especialidade: 'Ortopedia',          cidade: 'São Paulo',      uf: 'SP', avatarUrl: 'https://picsum.photos/200/200?random=21' },
    { email: 'leticia.marques@fitmax.com',name: 'Dra. Letícia Marques', especialidade: 'Endocrinologia',     cidade: 'Rio de Janeiro', uf: 'RJ', avatarUrl: 'https://picsum.photos/200/200?random=50' },
    { email: 'marcelo.strong@fitmax.com', name: 'Marcelo Strong',       especialidade: 'Fisioterapia',       cidade: 'Curitiba',       uf: 'PR', avatarUrl: 'https://picsum.photos/200/200?random=52' },
    { email: 'bruno.silva@fitmax.com',    name: 'Bruno Silva',          especialidade: 'Medicina Esportiva', cidade: 'Belo Horizonte', uf: 'MG', avatarUrl: 'https://picsum.photos/200/200?random=25' },
    { email: 'camila.nery@fitmax.com',    name: 'Dra. Camila Nery',     especialidade: 'Psicologia',         cidade: 'São Paulo',      uf: 'SP', avatarUrl: 'https://picsum.photos/200/200?random=22' },
    { email: 'vinicius.almeida@fitmax.com',name: 'Dr. Vinícius Almeida',especialidade: 'Nutrologia',         cidade: 'Porto Alegre',   uf: 'RS', avatarUrl: 'https://picsum.photos/200/200?random=60' },
    { email: 'rafael.costa@fitmax.com',   name: 'Dr. Rafael Costa',     especialidade: 'Cardiologia',        cidade: 'São Paulo',      uf: 'SP', avatarUrl: 'https://picsum.photos/200/200?random=21' },
  ];

  const profIds: Record<string, string> = {};

  for (const p of profissionais) {
    const exists = await prisma.professional.findUnique({ where: { email: p.email } });
    if (exists) {
      profIds[p.email] = exists.id;
      console.log(`⚠️  Profissional já existe: ${p.email} — pulando.`);
    } else {
      const created = await prisma.professional.create({
        data: { ...p, password: profHash, status: 'ATIVO', registroProfissional: `CFM ${Math.floor(10000 + Math.random() * 90000)} · ${p.uf}` },
      });
      profIds[p.email] = created.id;
      console.log(`✅ Profissional criado: ${p.name} (${p.especialidade})`);
    }
  }

  // ─── Publicações de Exemplo ───────────────────────────────────────────────
  const publicacoes = [
    { email: 'ana.souza@fitmax.com',       topico: 'Plano Nutricional',     caption: 'Plano alimentar personalizado para atletas de alto rendimento. Agende sua consulta!', imagemUrl: 'https://picsum.photos/600/400?random=3',  aspectRatio: 1.5 },
    { email: 'roberto.alves@fitmax.com',   topico: 'Saúde Óssea',          caption: 'Protocolos modernos de recuperação ortopédica esportiva. Agenda aberta para junho!',   imagemUrl: 'https://picsum.photos/600/500?random=5',  aspectRatio: 1.2 },
    { email: 'leticia.marques@fitmax.com', topico: 'Equilíbrio Hormonal',  caption: 'Avaliação completa com acompanhamento laboratorial de longa duração. Agende já!',     imagemUrl: 'https://picsum.photos/500/600?random=7',  aspectRatio: 0.83 },
    { email: 'marcelo.strong@fitmax.com',  topico: 'Fisioterapia Esport.', caption: 'Sessões de liberação miofascial e recovery pós-treino intenso. Vagas abertas!',       imagemUrl: 'https://picsum.photos/600/400?random=9',  aspectRatio: 1.5 },
    { email: 'bruno.silva@fitmax.com',     topico: 'Medicina Esportiva',   caption: 'Avaliação funcional e laudo para competições. Presencial e online.',                  imagemUrl: 'https://picsum.photos/600/600?random=11', aspectRatio: 1.0 },
    { email: 'camila.nery@fitmax.com',     topico: 'Saúde Mental no Esporte', caption: 'A mente é o músculo mais importante. Psicologia aplicada ao alto rendimento.',    imagemUrl: 'https://picsum.photos/600/400?random=13', aspectRatio: 1.5 },
    { email: 'vinicius.almeida@fitmax.com',topico: 'Suplementação Clínica',caption: 'Protocolos individualizados para melhoria do sono e rendimento. Consulta online!',   imagemUrl: 'https://picsum.photos/600/400?random=15', aspectRatio: 1.5 },
    { email: 'rafael.costa@fitmax.com',    topico: 'Cardiologia Esportiva',caption: 'Avaliação cardiológica para atletas e praticantes de atividade física intensa.',     imagemUrl: 'https://picsum.photos/600/400?random=17', aspectRatio: 1.5 },
  ];

  for (const pub of publicacoes) {
    const profId = profIds[pub.email];
    if (!profId) continue;
    const existing = await prisma.publicacao.findFirst({ where: { profissionalId: profId, topico: pub.topico } });
    if (!existing) {
      await prisma.publicacao.create({ data: { profissionalId: profId, topico: pub.topico, caption: pub.caption, imagemUrl: pub.imagemUrl, aspectRatio: pub.aspectRatio, status: 'ATIVA', likes: Math.floor(Math.random() * 500) } });
      console.log(`✅ Publicação criada: ${pub.topico} (${pub.email})`);
    }
  }


  // ─── Clientes de Teste ────────────────────────────────────────────────────
  const clientSenha = 'Client@123';
  const clientHash  = await bcrypt.hash(clientSenha, 12);

  const clientes = [
    { email: 'carlos.mendes@email.com', name: 'Carlos Mendes' },
    { email: 'fernanda.lima@email.com', name: 'Fernanda Lima' },
    { email: 'rafael.oliveira@email.com', name: 'Rafael Oliveira' },
  ];

  for (const c of clientes) {
    const exists = await prisma.client.findUnique({ where: { email: c.email } });
    if (exists) {
      console.log(`⚠️  Cliente já existe: ${c.email} — pulando.`);
    } else {
      await prisma.client.create({ data: { ...c, password: clientHash, status: 'ATIVO' } });
      console.log(`✅ Cliente criado: ${c.name} → ${c.email} / ${clientSenha}`);
    }
  }

  console.log('\n✅ Seed concluído!');
  console.log('\n📋 Credenciais de teste:');
  console.log('  🔑 Admin:         admin@fitmax.com     / Admin@123');
  console.log('  🩺 Profissional:  ana.souza@fitmax.com / Pro@123456  (e demais)');
  console.log('  👤 Cliente:       carlos.mendes@email.com / Client@123  (e demais)');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
