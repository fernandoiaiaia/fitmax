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

const postgres = require('postgres');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not set'); process.exit(1); }

const sql = postgres(DATABASE_URL);

async function main() {
  console.log('🧹 Limpando dados fictícios do banco de dados...\n');

  try {
    // A ordem de exclusão importa devido às Foreign Keys.
    // 1. Apagar Repasses e Denuncias (que dependem de Consultas, Publicações e Clientes)
    console.log('Apagando Repasses...');
    await sql`DELETE FROM "Repasse"`;

    console.log('Apagando Denuncias...');
    await sql`DELETE FROM "Denuncia"`;

    // 2. Apagar Consultas e Publicações
    console.log('Apagando Consultas...');
    await sql`DELETE FROM "Consulta"`;

    console.log('Apagando Publicacoes...');
    await sql`DELETE FROM "Publicacao"`;

    // 3. Apagar Clientes e Profissionais
    console.log('Apagando Clientes...');
    await sql`DELETE FROM "Client"`;

    console.log('Apagando Profissionais...');
    await sql`DELETE FROM "Professional"`;

    console.log('\n✅ Limpeza concluída com sucesso! O banco agora contém apenas a conta Admin.');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  } finally {
    await sql.end();
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
