#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const postgres = require('postgres');

// Load .env manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  });
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const sql = postgres(DATABASE_URL);
const hash = (p) => bcrypt.hash(p, 12);

async function importData() {
  console.log('📥 Iniciando importação de dados reais...\n');

  try {
    // 1. Importar Profissionais
    const profsFile = path.join(__dirname, 'data-import', 'profissionais.json');
    if (fs.existsSync(profsFile)) {
      const profsData = JSON.parse(fs.readFileSync(profsFile, 'utf8'));
      console.log(`Processando ${profsData.length} profissionais...`);
      for (const p of profsData) {
        const existing = await sql`SELECT id FROM "Professional" WHERE email = ${p.email}`;
        if (existing.length === 0) {
          const profHash = await hash(p.password || 'Mudar123!');
          await sql`
            INSERT INTO "Professional" (id, email, name, password, "especialidade", "avatarUrl", "registroProfissional", cpf, status, plano, "createdAt")
            VALUES (gen_random_uuid(), ${p.email}, ${p.name}, ${profHash}, ${p.especialidade}, ${p.avatarUrl}, ${p.registroProfissional}, ${p.cpf}, ${p.status}::"UserStatus", ${p.plano}, NOW())
          `;
          console.log(` ✅ Inserido: ${p.name}`);
        } else {
          console.log(` ⚠️ Já existe: ${p.email}`);
        }
      }
    } else {
      console.log('ℹ️ Arquivo profissionais.json não encontrado. Ignorando.');
    }

    // 2. Importar Clientes
    const clientesFile = path.join(__dirname, 'data-import', 'clientes.json');
    if (fs.existsSync(clientesFile)) {
      const clientesData = JSON.parse(fs.readFileSync(clientesFile, 'utf8'));
      console.log(`\nProcessando ${clientesData.length} clientes...`);
      for (const c of clientesData) {
        const existing = await sql`SELECT id FROM "Client" WHERE email = ${c.email}`;
        if (existing.length === 0) {
          const clientHash = await hash(c.password || 'Mudar123!');
          await sql`
            INSERT INTO "Client" (id, email, name, password, "avatarUrl", cpf, status, plano, "createdAt")
            VALUES (gen_random_uuid(), ${c.email}, ${c.name}, ${clientHash}, ${c.avatarUrl}, ${c.cpf}, ${c.status}::"UserStatus", ${c.plano}, NOW())
          `;
          console.log(` ✅ Inserido: ${c.name}`);
        } else {
          console.log(` ⚠️ Já existe: ${c.email}`);
        }
      }
    } else {
      console.log('\nℹ️ Arquivo clientes.json não encontrado. Ignorando.');
    }

    console.log('\n🎉 Importação finalizada com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante a importação:', err.message);
  } finally {
    await sql.end();
  }
}

importData().catch(e => { console.error('❌', e.message); process.exit(1); });
