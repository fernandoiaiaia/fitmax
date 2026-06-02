// pro-backend-e2e.js
// Teste de Ponta a Ponta (E2E) para as APIs do FitMax Professional (web-pro)
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

const PRO_EMAIL = 'rafael.costa@fitmax.com';
const PRO_PASSWORD = 'Pro@123456';

(async () => {
  console.log('==================================================');
  console.log('🎬 INICIANDO TESTE E2E DO BACK-END (PRO) - FITMAX');
  console.log('==================================================\n');

  try {
    let proToken = '';

    // ----------------------------------------------------
    // FASE 1: Fluxo de Autenticação Segura (Login Profissional)
    // ----------------------------------------------------
    console.log('🔐 Fase 1: Autenticação Segura (Pro Login)');

    // 1.1 Tentativa com credenciais incorretas (Rejeição Segura)
    console.log('   - Tentando login com senha incorreta...');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/pro/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: PRO_EMAIL, password: 'WrongPassword' })
    });
    console.log(`   - Status HTTP: ${badLoginRes.status}`);
    if (badLoginRes.status !== 401) {
      throw new Error('Falha de Segurança: O login deveria ser rejeitado com 401!');
    }
    console.log('   ✅ login incorreto rejeitado corretamente.');

    // 1.2 Autenticação Professional com sucesso (Obter Token)
    console.log('\n   - Efetuando login do Profissional (rafael.costa)...');
    const proLoginRes = await fetch(`${BASE_URL}/api/auth/pro/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: PRO_EMAIL, password: PRO_PASSWORD })
    });

    if (!proLoginRes.ok) {
      throw new Error(`Falha no login do Pro (${proLoginRes.status})`);
    }
    const proData = await proLoginRes.json();
    proToken = proData.accessToken;
    console.log('   ✅ Profissional autenticado com sucesso! JWT gerado.');

    // ----------------------------------------------------
    // FASE 2: Barreiras de Segurança (Middlewares de Autenticação e RBAC)
    // ----------------------------------------------------
    console.log('\n🛡️ Fase 2: Blindagem de Segurança (RBAC)');

    // 2.1 Requisição sem cabeçalho Authorization
    console.log('   - Tentando carregar perfil sem Token...');
    const noTokenRes = await fetch(`${BASE_URL}/api/pro/me`);
    console.log(`   - Status HTTP: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser negada com 401!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Falta Token).');

    // 2.2 Requisição com token para uma rota admin (RBAC test)
    console.log('\n   - Tentando acessar rotas administrativas com Token de Profissional...');
    const adminRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    console.log(`   - Status HTTP: ${adminRbacRes.status}`);
    if (adminRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada por RBAC com 403!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Autorização negada/Forbidden).');

    // ----------------------------------------------------
    // FASE 3: Consultas de Perfil, Dashboard e Dados Reais (PostgreSQL)
    // ----------------------------------------------------
    console.log('\n📊 Fase 3: Consultas de Leitura e Integração no PostgreSQL');

    // 3.1 Perfil Pessoal (/pro/me)
    console.log('   - Requisitando perfil do profissional logado (/pro/me)...');
    const meRes = await fetch(`${BASE_URL}/api/pro/me`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    if (!meRes.ok) throw new Error(`Falha ao carregar perfil (${meRes.status})`);
    const meData = await meRes.json();
    console.log(`   - Status HTTP: ${meRes.status}`);
    console.log(`   - Identificado: "${meData.name}" (Especialidade: ${meData.especialidade} | Registro: ${meData.registroProfissional})`);
    if (meData.email !== PRO_EMAIL) {
      throw new Error('Erro na integração: Perfil retornado não condiz com o profissional logado.');
    }
    console.log('   ✅ Perfil do profissional carregado com sucesso.');

    // 3.2 Sumário do Dashboard (/pro/dashboard/summary)
    console.log('\n   - Solicitando sumário do dashboard do profissional...');
    const summaryRes = await fetch(`${BASE_URL}/api/pro/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    if (!summaryRes.ok) throw new Error(`Falha ao carregar sumário (${summaryRes.status})`);
    const summaryData = await summaryRes.json();
    console.log(`   - Consultas Hoje: Total: ${summaryData.consultas.total} | Agendada: ${summaryData.consultas.agendada} | Concluída: ${summaryData.consultas.concluida}`);
    console.log(`   - Destaques do Feed carregados: ${summaryData.feedDestaques.length} posts.`);
    console.log(`   - Slots livres hoje cadastrados: ${summaryData.slotsDisponiveisHoje}`);
    console.log('   ✅ Sumário do dashboard carregado e integrado com sucesso.');

    // 3.3 Listagem de Consultas (/pro/consultas)
    console.log('\n   - Listando agendamentos do profissional (/pro/consultas)...');
    const consultasRes = await fetch(`${BASE_URL}/api/pro/consultas`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    if (!consultasRes.ok) throw new Error(`Falha ao listar consultas (${consultasRes.status})`);
    const consultasData = await consultasRes.json();
    console.log(`   - Total de consultas encontradas: ${consultasData.meta.total}`);
    if (consultasData.data.length > 0) {
      console.log(`     -> Primeira consulta com: "${consultasData.data[0].paciente.nome}" (Status: ${consultasData.data[0].status})`);
    }
    console.log('   ✅ Listagem de consultas executada com sucesso.');

    // 3.4 Resumo do Período (/pro/consultas/resumo-periodo)
    console.log('\n   - Solicitando resumo do período financeiro (/pro/consultas/resumo-periodo)...');
    const resumoPeriodoRes = await fetch(`${BASE_URL}/api/pro/consultas/resumo-periodo`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    if (!resumoPeriodoRes.ok) throw new Error(`Falha ao carregar resumo do período (${resumoPeriodoRes.status})`);
    const resumoPeriodoData = await resumoPeriodoRes.json();
    console.log(`   - Agendamentos no Período: ${resumoPeriodoData.agendamentos}`);
    console.log(`   - Valor Gerado: R$${resumoPeriodoData.valorGeradoReais}`);
    console.log('   ✅ Resumo financeiro do período carregado com sucesso.');

    // ----------------------------------------------------
    // FASE 4: Integração de Escrita de Ponta a Ponta (Toggles e Feed)
    // ----------------------------------------------------
    console.log('\n⚡ Fase 4: Operações de Escrita E2E (Consultas & Feed)');

    // 4.1 Modificar status de agendamento (Toggle Status)
    const targetConsulta = consultasData.data.find(c => c.status === 'agendada');
    if (targetConsulta) {
      console.log(`   - Atualizando status da consulta (${targetConsulta.id}) para "em_andamento"...`);
      const updateRes = await fetch(`${BASE_URL}/api/pro/consultas/${targetConsulta.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proToken}`
        },
        body: JSON.stringify({ status: 'em_andamento' })
      });
      if (!updateRes.ok) throw new Error(`Erro ao atualizar status da consulta (${updateRes.status})`);
      const updateData = await updateRes.json();
      console.log(`     -> Status retornado: "${updateData.status}"`);

      // Reverte status para manter o banco limpo
      console.log(`   - Revertendo status da consulta (${targetConsulta.id}) para "agendada"...`);
      const revertRes = await fetch(`${BASE_URL}/api/pro/consultas/${targetConsulta.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${proToken}`
        },
        body: JSON.stringify({ status: 'agendada' })
      });
      if (!revertRes.ok) throw new Error(`Erro ao reverter status da consulta (${revertRes.status})`);
      console.log('   ✅ Fluxo de alteração de consulta aprovado e revertido.');
    } else {
      console.log('   ⚠️ Nenhuma consulta agendada encontrada para testar toggle de status.');
    }

    // 4.2 Criar e Deletar Publicação no Feed
    console.log('\n   - Criando nova publicação de teste no feed (/pro/feed)...');
    const feedCreateRes = await fetch(`${BASE_URL}/api/pro/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proToken}`
      },
      body: JSON.stringify({
        topico: 'Dicas E2E Backend',
        caption: 'Publicação temporária para validar integridade de escrita de feed via E2E.',
        imagemUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        aspectRatio: 1.5
      })
    });
    if (!feedCreateRes.ok) throw new Error(`Erro ao criar publicação (${feedCreateRes.status})`);
    const feedCreateData = await feedCreateRes.json();
    const createdPubId = feedCreateData.id;
    console.log(`   ✅ Publicação criada com ID: "${createdPubId}"`);

    // Deleta para deixar o banco de dados original intocado
    console.log(`   - Removendo publicação temporária (${createdPubId}) do feed...`);
    const feedDeleteRes = await fetch(`${BASE_URL}/api/pro/feed/${createdPubId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${proToken}`
      }
    });
    if (!feedDeleteRes.ok) throw new Error(`Erro ao deletar publicação (${feedDeleteRes.status})`);
    console.log('   ✅ Publicação de teste deletada com sucesso.');

    console.log('\n==================================================');
    console.log('🎉 TESTE E2E DO BACK-END (PRO) EXECUTADO COM 100% SUCESSO!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no teste E2E do backend (Pro):', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
