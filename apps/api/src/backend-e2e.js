// backend-e2e.js
// Teste de Ponta a Ponta (E2E) para as APIs do FITMAX
require('dotenv').config();

// Global intercept fetch to inject the bypass header
const originalFetch = global.fetch;
global.fetch = function (url, options = {}) {
  options.headers = options.headers || {};
  options.headers['x-bypass-rate-limit'] = 'true';
  return originalFetch(url, options);
};

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

const ADMIN_EMAIL = 'admin@fitmax.com';
const ADMIN_PASSWORD = 'Admin@123';
const CLIENT_EMAIL = 'carlos.mendes@email.com';
const CLIENT_PASSWORD = 'Client@123';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('==================================================');
  console.log('🎬 INICIANDO TESTE E2E DO BACK-END (APIs) - FITMAX');
  console.log('==================================================\n');

  try {
    let adminToken = '';
    let clientToken = '';
    let targetUserId = '';
    let targetUserTipo = '';

    // ----------------------------------------------------
    // FASE 1: Fluxo de Autenticação Segura (Admins e Clientes)
    // ----------------------------------------------------
    console.log('🔐 Fase 1: Autenticação Segura');
    
    // 1.1 Tentativa com credenciais incorretas (Rejeição Segura)
    console.log('   - Tentando login com senha incorreta (Admin)...');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: 'WrongPassword' })
    });
    console.log(`   - Status HTTP: ${badLoginRes.status}`);
    if (badLoginRes.status !== 401) {
      throw new Error('Falha de Segurança: O login deveria ser rejeitado com 401!');
    }
    console.log('   ✅ login incorreto rejeitado corretamente.');

    // 1.2 Autenticação Admin com sucesso (Obter Token)
    console.log('\n   - Efetuando login do Administrador...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!adminLoginRes.ok) {
      throw new Error(`Falha no login do Admin (${adminLoginRes.status})`);
    }
    const adminData = await adminLoginRes.json();
    adminToken = adminData.accessToken;
    console.log('   ✅ Admin autenticado com sucesso! JWT gerado.');

    // 1.3 Autenticação Cliente com sucesso (Obter Token para testar RBAC)
    console.log('\n   - Efetuando login do Cliente (carlos.mendes)...');
    const clientLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD })
    });
    
    if (!clientLoginRes.ok) {
      throw new Error(`Falha no login do Cliente (${clientLoginRes.status})`);
    }
    const clientData = await clientLoginRes.json();
    clientToken = clientData.accessToken;
    console.log('   ✅ Cliente autenticado com sucesso! JWT gerado.');

    // ----------------------------------------------------
    // FASE 2: Barreiras de Segurança (Middlewares de Autenticação e RBAC)
    // ----------------------------------------------------
    console.log('\n🛡️ Fase 2: Blindagem de Segurança (RBAC)');

    // 2.1 Requisição sem cabeçalho Authorization
    console.log('   - Tentando listar usuários SEM Token...');
    const noTokenRes = await fetch(`${BASE_URL}/api/admin/usuarios`);
    console.log(`   - Status HTTP: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser negada com 401!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Falta Token).');

    // 2.2 Requisição com token de Cliente (Role incorreta - Apenas Admin tem acesso)
    console.log('\n   - Tentando listar usuários administrativos com Token de Cliente...');
    const clientRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    console.log(`   - Status HTTP: ${clientRbacRes.status}`);
    if (clientRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada por RBAC com 403!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Autorização negada/Forbidden).');

    // ----------------------------------------------------
    // FASE 3: Integração de Leitura E2E (Filtros, Estatísticas, Consultas)
    // ----------------------------------------------------
    console.log('\n📊 Fase 3: Consultas e Leitura no PostgreSQL (Admin)');

    // 3.1 Listagem Geral
    console.log('   - Requisitando listagem geral de usuários...');
    const listRes = await fetch(`${BASE_URL}/api/admin/usuarios?limit=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!listRes.ok) throw new Error(`Falha ao listar usuários (${listRes.status})`);
    const listData = await listRes.json();
    
    console.log(`   - Status HTTP: ${listRes.status}`);
    console.log(`   - Total mapeado no banco: ${listData.meta.total} usuários.`);
    if (listData.data.length === 0) {
      throw new Error('Nenhum usuário cadastrado no banco para teste.');
    }
    
    // Captura primeiro usuário para teste de escrita
    targetUserId = listData.data[0].id;
    targetUserTipo = listData.data[0].tipo;
    console.log(`   ✅ Listagem OK. Usuário alvo selecionado para escrita: "${listData.data[0].nome}" (${targetUserId})`);

    // 3.2 Busca com filtro (Busca por nome)
    console.log('\n   - Efetuando busca com filtro por nome (ex: "Roberto")...');
    const searchRes = await fetch(`${BASE_URL}/api/admin/usuarios?search=Roberto`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!searchRes.ok) throw new Error(`Falha na busca filtrada (${searchRes.status})`);
    const searchData = await searchRes.json();
    console.log(`   - Usuários localizados: ${searchData.data.length}`);
    searchData.data.forEach(u => console.log(`     -> Achou: "${u.nome}" (Tipo: ${u.tipo})`));
    console.log('   ✅ Busca filtrada concluída com sucesso.');

    // 3.3 Consumo de Resumos e Estatísticas
    console.log('\n   - Solicitando resumo geral estatístico (/resumo)...');
    const resumoRes = await fetch(`${BASE_URL}/api/admin/usuarios/resumo`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!resumoRes.ok) throw new Error(`Falha ao carregar resumo (${resumoRes.status})`);
    const resumoData = await resumoRes.json();
    console.log(`   - Estatísticas carregadas: Total: ${resumoData.total} | Ativos: ${resumoData.ativos} | Inativos: ${resumoData.inativos} | Banidos: ${resumoData.banidos}`);
    console.log('   ✅ Resumo estatístico carregado com sucesso.');

    // ----------------------------------------------------
    // FASE 4: Integração de Escrita de Moderação (Toggle Status, Ban e Restore)
    // ----------------------------------------------------
    console.log('\n⚡ Fase 4: Moderação e Escrita de Estado');

    // 4.1 Modificar status de ATIVO para INATIVO (ou vice-versa)
    console.log(`   - Modificando status do usuário (${targetUserId})...`);
    const statusBefore = listData.data[0].status;
    const nextStatus = statusBefore === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    
    const toggleRes = await fetch(`${BASE_URL}/api/admin/usuarios/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ tipo: targetUserTipo, novoStatus: nextStatus })
    });
    
    if (!toggleRes.ok) throw new Error(`Erro no PATCH toggleStatus (${toggleRes.status})`);
    console.log(`   - Status HTTP: ${toggleRes.status}`);
    
    // Confirma atualização recarregando o usuário
    const checkRes = await fetch(`${BASE_URL}/api/admin/usuarios?search=${listData.data[0].email}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const checkData = await checkRes.json();
    const updatedStatus = checkData.data[0].status;
    console.log(`   - Status Original: "${statusBefore}" -> Status Atualizado no PostgreSQL: "${updatedStatus}"`);
    if (updatedStatus !== nextStatus) {
      throw new Error('Erro na atualização: O status gravado no banco não condiz com a solicitação.');
    }
    console.log('   ✅ Alteração de status persistida com sucesso.');

    // 4.2 Banir usuário da plataforma
    console.log(`\n   - Banindo usuário (${targetUserId}) por infração de termos...`);
    const banRes = await fetch(`${BASE_URL}/api/admin/usuarios/${targetUserId}/banir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tipo: targetUserTipo, motivo: 'Infração de conduta no teste E2E backend' })
    });
    
    if (!banRes.ok) throw new Error(`Erro ao banir usuário (${banRes.status})`);
    
    // Confirma que status foi para BANIDO
    const checkBanRes = await fetch(`${BASE_URL}/api/admin/usuarios?search=${listData.data[0].email}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const checkBanData = await checkBanRes.json();
    console.log(`   - Status após banimento: "${checkBanData.data[0].status}"`);
    if (checkBanData.data[0].status !== 'BANIDO') {
      throw new Error('Falha no banimento: O status no banco não foi alterado para BANIDO.');
    }
    console.log('   ✅ Banimento executado e auditado com sucesso no PostgreSQL.');

    // 4.3 Restaurar acesso do usuário
    console.log(`\n   - Restaurando acesso do usuário banido (${targetUserId})...`);
    const restoreRes = await fetch(`${BASE_URL}/api/admin/usuarios/${targetUserId}/restaurar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ tipo: targetUserTipo })
    });
    
    if (!restoreRes.ok) throw new Error(`Erro ao restaurar usuário (${restoreRes.status})`);

    // Confirma retorno para ATIVO
    const checkRestoreRes = await fetch(`${BASE_URL}/api/admin/usuarios?search=${listData.data[0].email}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const checkRestoreData = await checkRestoreRes.json();
    console.log(`   - Status final após restauração: "${checkRestoreData.data[0].status}"`);
    if (checkRestoreData.data[0].status !== 'ATIVO') {
      throw new Error('Falha na restauração: O status não retornou para ATIVO.');
    }
    console.log('   ✅ Restauração de acesso executada com sucesso.');

    console.log('\n==================================================');
    console.log('🎉 TESTE E2E DO BACK-END EXECUTADO COM 100% SUCESSO!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no teste E2E do backend:', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
