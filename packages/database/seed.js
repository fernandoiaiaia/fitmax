#!/usr/bin/env node
'use strict';

// Load .env manually
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  });
}

const bcrypt = require('bcryptjs');
const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const sql = postgres(DATABASE_URL);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const hash = (p) => bcrypt.hash(p, 12);
const brl  = (reais) => Math.round(reais * 100); // converte para centavos

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Admin ────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@fitmax.com';
  const existingAdmin = await sql`SELECT id FROM "Admin" WHERE email = ${adminEmail}`;
  let adminId;
  if (existingAdmin.length > 0) {
    adminId = existingAdmin[0].id;
    console.log(`⚠️  Admin já existe: ${adminEmail}`);
  } else {
    const adminHash = await hash('Admin@123');
    const [admin] = await sql`
      INSERT INTO "Admin" (id, email, password, "createdAt")
      VALUES (gen_random_uuid(), ${adminEmail}, ${adminHash}, NOW())
      RETURNING id
    `;
    adminId = admin.id;
    console.log(`✅ Admin criado: ${adminEmail} / Admin@123`);
  }

  // ── Profissionais ─────────────────────────────────────────────────────────
  const profData = [
    { email: 'rafael.costa@fitmax.com',     name: 'Dr. Rafael Costa',          especialidade: 'Cardiologia',        avatar: 'https://picsum.photos/200/200?random=21', registro: 'CRM 54.321 · SP',  cpf: '123.456.789-01', status: 'ATIVO',   plano: 'Pro Anual'  },
    { email: 'juliana.mendes@fitmax.com',   name: 'Dra. Juliana Mendes',        especialidade: 'Psicologia',         avatar: 'https://picsum.photos/200/200?random=23', registro: 'CRP 45.678 · SP',  cpf: '234.567.890-12', status: 'INATIVO', plano: null         },
    { email: 'carlos.eduardo@fitmax.com',   name: 'Dr. Carlos Eduardo',         especialidade: 'Ortopedia',          avatar: 'https://picsum.photos/200/200?random=50', registro: 'CRM 63.210 · RJ',  cpf: '345.678.901-23', status: 'ATIVO',   plano: 'Pro Mensal' },
    { email: 'simone.alves@fitmax.com',     name: 'Dra. Simone Alves',          especialidade: 'Nutrição',           avatar: 'https://picsum.photos/200/200?random=60', registro: 'CRN 12.344 · MG',  cpf: '456.789.012-34', status: 'ATIVO',   plano: 'Pro Anual'  },
    { email: 'beatriz.oliveira@fitmax.com', name: 'Dra. Beatriz Oliveira',      especialidade: 'Dermatologia',       avatar: 'https://picsum.photos/id/64/200/200',     registro: 'CRM 84.521 · SP',  cpf: '567.890.123-45', status: 'ATIVO',   plano: 'Pro Mensal' },
    { email: 'fitcore.studio@fitmax.com',   name: 'Personal Studio FitCore',    especialidade: 'Personal Trainer',   avatar: 'https://picsum.photos/200/200?random=24', registro: 'CREF 28.450 · RJ', cpf: '678.901.234-56', status: 'ATIVO',   plano: 'Pro Mensal' },
    { email: 'marcelo.strong@fitmax.com',   name: 'Marcelo Strong',             especialidade: 'Fisiculturista PRO', avatar: 'https://picsum.photos/200/200?random=52', registro: 'CREF 77.001 · GO', cpf: '789.012.345-67', status: 'BANIDO',  plano: null         },
  ];

  const profs = {};
  for (const p of profData) {
    const existing = await sql`SELECT id FROM "Professional" WHERE email = ${p.email}`;
    if (existing.length > 0) {
      profs[p.email] = existing[0].id;
      // update campos novos se ainda não preenchidos
      await sql`
        UPDATE "Professional" SET
          "registroProfissional" = COALESCE("registroProfissional", ${p.registro}),
          cpf    = COALESCE(cpf, ${p.cpf}),
          status = COALESCE(status, ${p.status}::"UserStatus"),
          plano  = COALESCE(plano, ${p.plano})
        WHERE id = ${existing[0].id}
      `;
    } else {
      const profHash = await hash('Prof@123');
      const [prof] = await sql`
        INSERT INTO "Professional" (id, email, name, password, "especialidade", "avatarUrl", "registroProfissional", cpf, status, plano, "createdAt")
        VALUES (gen_random_uuid(), ${p.email}, ${p.name}, ${profHash}, ${p.especialidade}, ${p.avatar}, ${p.registro}, ${p.cpf}, ${p.status}::"UserStatus", ${p.plano}, NOW())
        RETURNING id
      `;
      profs[p.email] = prof.id;
    }
  }
  console.log(`✅ ${profData.length} profissionais prontos`);

  // ── Clientes ───────────────────────────────────────────────────────────
  const clientData = [
    { email: 'amanda.silva@email.com',    name: 'Amanda Silva',    avatar: 'https://picsum.photos/id/26/200/200',     cpf: '012.345.678-90', status: 'ATIVO',   plano: 'Premium' },
    { email: 'marcos.nogueira@email.com', name: 'Marcos Nogueira', avatar: 'https://picsum.photos/id/1012/200/200',   cpf: '901.234.567-89', status: 'ATIVO',   plano: 'Básico'  },
    { email: 'renata.faria@email.com',    name: 'Renata Faria',    avatar: 'https://picsum.photos/200/200?random=32', cpf: '890.123.456-78', status: 'ATIVO',   plano: 'Premium' },
    { email: 'tiago.gomes@email.com',     name: 'Tiago Gomes',     avatar: 'https://picsum.photos/200/200?random=33', cpf: '098.765.432-10', status: 'INATIVO', plano: null      },
    { email: 'luiza.moreira@email.com',   name: 'Luiza Moreira',   avatar: 'https://picsum.photos/200/200?random=34', cpf: '111.222.333-44', status: 'INATIVO', plano: null      },
    { email: 'pedro.santos@email.com',    name: 'Pedro Santos',    avatar: 'https://picsum.photos/200/200?random=35', cpf: '222.333.444-55', status: 'ATIVO',   plano: 'Básico'  },
    { email: 'carla.lima@email.com',      name: 'Carla Lima',      avatar: 'https://picsum.photos/200/200?random=36', cpf: '333.444.555-66', status: 'ATIVO',   plano: 'Premium' },
  ];

  const clients = {};
  for (const c of clientData) {
    const existing = await sql`SELECT id FROM "Client" WHERE email = ${c.email}`;
    if (existing.length > 0) {
      clients[c.email] = existing[0].id;
      await sql`
        UPDATE "Client" SET
          cpf    = COALESCE(cpf, ${c.cpf}),
          status = COALESCE(status, ${c.status}::"UserStatus"),
          plano  = COALESCE(plano, ${c.plano})
        WHERE id = ${existing[0].id}
      `;
    } else {
      const clientHash = await hash('Client@123');
      const [client] = await sql`
        INSERT INTO "Client" (id, email, name, password, "avatarUrl", cpf, status, plano, "createdAt")
        VALUES (gen_random_uuid(), ${c.email}, ${c.name}, ${clientHash}, ${c.avatar}, ${c.cpf}, ${c.status}::"UserStatus", ${c.plano}, NOW())
        RETURNING id
      `;
      clients[c.email] = client.id;
    }
  }
  console.log(`✅ ${clientData.length} clientes prontos`);

  // ── Consultas ─────────────────────────────────────────────────────────────
  const existingConsultas = await sql`SELECT COUNT(*) as count FROM "Consulta"`;
  if (parseInt(existingConsultas[0].count) > 0) {
    console.log(`⚠️  Consultas já existem — pulando`);
  } else {
    const now = new Date();
    const daysAgo = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt; };
    const daysAhead = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt; };

    const consultasData = [
      { prof: 'rafael.costa@fitmax.com',   client: 'amanda.silva@email.com',   esp: 'Cardiologia', tipo: 'PRESENCIAL', dataHora: daysAgo(0),  valor: brl(350), status: 'PAGO',     repasseEm: daysAgo(0) },
      { prof: 'juliana.mendes@fitmax.com', client: 'marcos.nogueira@email.com', esp: 'Psicologia',  tipo: 'ONLINE',     dataHora: daysAgo(0),  valor: brl(200), status: 'PENDENTE', repasseEm: null },
      { prof: 'carlos.eduardo@fitmax.com', client: 'renata.faria@email.com',   esp: 'Ortopedia',   tipo: 'PRESENCIAL', dataHora: daysAhead(1), valor: brl(400), status: 'ESTORNO',  repasseEm: null },
      { prof: 'simone.alves@fitmax.com',   client: 'tiago.gomes@email.com',    esp: 'Nutrição',    tipo: 'ONLINE',     dataHora: daysAhead(2), valor: brl(250), status: 'PAGO',     repasseEm: daysAgo(1) },
      { prof: 'rafael.costa@fitmax.com',   client: 'luiza.moreira@email.com',  esp: 'Cardiologia', tipo: 'PRESENCIAL', dataHora: daysAgo(14), valor: brl(350), status: 'PENDENTE', repasseEm: null },
      { prof: 'juliana.mendes@fitmax.com', client: 'pedro.santos@email.com',   esp: 'Psicologia',  tipo: 'ONLINE',     dataHora: daysAgo(7),  valor: brl(180), status: 'PAGO',     repasseEm: daysAgo(6) },
      { prof: 'carlos.eduardo@fitmax.com', client: 'carla.lima@email.com',     esp: 'Ortopedia',   tipo: 'PRESENCIAL', dataHora: daysAgo(3),  valor: brl(500), status: 'PENDENTE', repasseEm: null },
      { prof: 'simone.alves@fitmax.com',   client: 'amanda.silva@email.com',   esp: 'Nutrição',    tipo: 'ONLINE',     dataHora: daysAgo(21), valor: brl(220), status: 'PAGO',     repasseEm: daysAgo(20) },
    ];

    for (const c of consultasData) {
      const repasse = Math.round(c.valor * 0.9); // 10% plataforma
      await sql`
        INSERT INTO "Consulta" (id, "profissionalId", "clienteId", especialidade, tipo, "dataHora",
          "valorCentavos", "taxaPlataforma", status, "repasseEm", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${profs[c.prof]}, ${clients[c.client]},
          ${c.esp}, ${c.tipo}::"ConsultaTipo", ${c.dataHora},
          ${c.valor}, 10,
          ${c.status}::"ConsultaStatus",
          ${c.repasseEm},
          NOW(), NOW()
        )
      `;
    }
    console.log(`✅ ${consultasData.length} consultas criadas`);
  }

  // ── Publicações ───────────────────────────────────────────────────────────
  const existingPubs = await sql`SELECT COUNT(*) as count FROM "Publicacao"`;
  if (parseInt(existingPubs[0].count) > 0) {
    console.log(`⚠️  Publicações já existem — pulando`);
  } else {
    const now = new Date();
    const hoursAgo = (h) => { const dt = new Date(now); dt.setHours(dt.getHours() - h); return dt; };
    const daysAgo  = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() - d); return dt; };

    const pubsData = [
      { prof: 'beatriz.oliveira@fitmax.com', topico: 'Dermatologia',  status: 'ATIVA',      aspectRatio: 0.87, likes: 312,  comentarios: 24, createdAt: hoursAgo(2),  imagemUrl: 'https://picsum.photos/600/520?random=110', caption: 'Cuidar da pele no verão é essencial. Aplique protetor solar FPS 50+ a cada 2 horas, evite exposição direta entre 10h e 16h e mantenha-se hidratada.' },
      { prof: 'rafael.costa@fitmax.com',     topico: 'Cardiologia',   status: 'ATIVA',      aspectRatio: 1.5,  likes: 198,  comentarios: 11, createdAt: hoursAgo(5),  imagemUrl: 'https://picsum.photos/600/400?random=210', caption: 'A saúde cardiovascular começa na alimentação. Reduza o sódio, aumente o potássio e pratique exercícios aeróbicos regularmente.' },
      { prof: 'fitcore.studio@fitmax.com',   topico: 'Fitness',       status: 'DENUNCIADA', aspectRatio: 0.86, likes: 534,  comentarios: 47, createdAt: hoursAgo(8),  imagemUrl: 'https://picsum.photos/600/700?random=310', caption: 'Fortalecimento do core e correção postural. Pacotes mensais com desconto especial para novos alunos!' },
      { prof: 'simone.alves@fitmax.com',     topico: 'Nutrição',      status: 'ATIVA',      aspectRatio: 1.33, likes: 87,   comentarios: 8,  createdAt: daysAgo(1),   imagemUrl: 'https://picsum.photos/600/450?random=410', caption: 'Plano alimentar personalizado para atletas de alto rendimento. Agendamentos disponíveis para o mês de maio.' },
      { prof: 'marcelo.strong@fitmax.com',   topico: 'Musculação',    status: 'BANIDA',     aspectRatio: 1.0,  likes: 1240, comentarios: 89, createdAt: daysAgo(2),   imagemUrl: 'https://picsum.photos/600/600?random=510', caption: 'Desconto ABSURDO de 60% na minha mentoria anual! Não perca! Oferta por tempo limitado.', motivoBan: 'Conteúdo promocional abusivo' },
      { prof: 'juliana.mendes@fitmax.com',   topico: 'Saúde Mental',  status: 'ATIVA',      aspectRatio: 0.75, likes: 420,  comentarios: 36, createdAt: daysAgo(3),   imagemUrl: 'https://picsum.photos/600/800?random=610', caption: 'Saúde mental é prioridade. Agende sua sessão e dê o primeiro passo para o seu equilíbrio emocional.' },
    ];

    for (const p of pubsData) {
      await sql`
        INSERT INTO "Publicacao" (id, "profissionalId", topico, caption, "imagemUrl", "aspectRatio",
          likes, comentarios, status, "motivoBan", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${profs[p.prof]},
          ${p.topico}, ${p.caption}, ${p.imagemUrl}, ${p.aspectRatio},
          ${p.likes}, ${p.comentarios},
          ${p.status}::"PublicacaoStatus",
          ${p.motivoBan ?? null},
          ${p.createdAt}, NOW()
        )
      `;
    }
    console.log(`✅ ${pubsData.length} publicações criadas`);
  }

  console.log('\n✅ Seed concluído!');
  await sql.end();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
