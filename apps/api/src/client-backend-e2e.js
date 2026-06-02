// client-backend-e2e.js
// Teste de Ponta a Ponta (E2E) para as APIs do FitMax Client (web-client - Portal do Paciente)
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

const CLIENT_EMAIL = 'carlos.mendes@email.com';
const CLIENT_PASSWORD = 'Client@123';

(async () => {
  console.log('==================================================');
  console.log('🎬 INICIANDO TESTE E2E DO BACK-END (PACIENTE) - FITMAX');
  console.log('==================================================\n');

  try {
    let clientToken = '';

    // ----------------------------------------------------
    // FASE 1: Fluxo de Autenticação Segura (Login Paciente)
    // ----------------------------------------------------
    console.log('🔐 Fase 1: Autenticação Segura (Client Login)');

    // 1.1 Tentativa com credenciais incorretas (Rejeição Segura)
    console.log('   - Tentando login com senha incorreta...');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: 'WrongPassword' })
    });
    console.log(`   - Status HTTP: ${badLoginRes.status}`);
    if (badLoginRes.status !== 401) {
      throw new Error('Falha de Segurança: O login deveria ser rejeitado com 401!');
    }
    console.log('   ✅ Login incorreto rejeitado corretamente.');

    // 1.2 Autenticação Patient com sucesso (Obter Token)
    console.log('\n   - Efetuando login do Paciente (carlos.mendes)...');
    const clientLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD })
    });

    if (!clientLoginRes.ok) {
      throw new Error(`Falha no login do Paciente (${clientLoginRes.status})`);
    }
    const clientData = await clientLoginRes.json();
    clientToken = clientData.accessToken;
    console.log('   ✅ Paciente autenticado com sucesso! JWT gerado.');

    // ----------------------------------------------------
    // FASE 2: Barreiras de Segurança (Middlewares de Autenticação e RBAC)
    // ----------------------------------------------------
    console.log('\n🛡️ Fase 2: Blindagem de Segurança (RBAC)');

    // 2.1 Requisição sem cabeçalho Authorization
    console.log('   - Tentando carregar estatísticas sem Token...');
    const noTokenRes = await fetch(`${BASE_URL}/api/client-portal/consultas/stats`);
    console.log(`   - Status HTTP: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser negada com 401!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Falta Token).');

    // 2.2 Requisição com token de paciente para uma rota admin (RBAC test)
    console.log('\n   - Tentando acessar rotas administrativas com Token de Paciente...');
    const adminRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    console.log(`   - Status HTTP: ${adminRbacRes.status}`);
    if (adminRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada por RBAC com 403!');
    }
    console.log('   ✅ Acesso bloqueado corretamente (Autorização negada/Forbidden).');

    // ----------------------------------------------------
    // FASE 3: Consultas de Leitura e Integração no PostgreSQL
    // ----------------------------------------------------
    console.log('\n📊 Fase 3: Consultas de Leitura e Integração no PostgreSQL');

    // 3.1 Estatísticas de Consultas (/client-portal/consultas/stats)
    console.log('   - Requisitando estatísticas de consultas (/client-portal/consultas/stats)...');
    const statsRes = await fetch(`${BASE_URL}/api/client-portal/consultas/stats`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    if (!statsRes.ok) throw new Error(`Falha ao carregar stats (${statsRes.status})`);
    const statsData = await statsRes.json();
    console.log(`   - Status HTTP: ${statsRes.status}`);
    console.log(`   - Total Consultas: ${statsData.totalConsultas} | Investido: R$${statsData.totalInvestidoReais} | Hoje: ${statsData.consultasHoje}`);
    console.log('   ✅ Estatísticas carregadas com sucesso.');

    // 3.2 Listagem de Consultas (/client-portal/consultas)
    console.log('\n   - Listando agendamentos do paciente (/client-portal/consultas)...');
    const consultasRes = await fetch(`${BASE_URL}/api/client-portal/consultas`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    if (!consultasRes.ok) throw new Error(`Falha ao listar consultas (${consultasRes.status})`);
    const consultasData = await consultasRes.json();
    console.log(`   - Total de consultas encontradas: ${consultasData.meta.total}`);
    if (consultasData.data.length > 0) {
      console.log(`     -> Primeira consulta com: "${consultasData.data[0].profissional.name}" (Status: ${consultasData.data[0].statusFluxo})`);
    }
    console.log('   ✅ Listagem de consultas executada com sucesso.');

    // 3.3 Listar Profissionais Disponíveis (/client-portal/profissionais)
    console.log('\n   - Listando profissionais disponíveis (/client-portal/profissionais)...');
    const profissionaisRes = await fetch(`${BASE_URL}/api/client-portal/profissionais`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    if (!profissionaisRes.ok) throw new Error(`Falha ao listar profissionais (${profissionaisRes.status})`);
    const profissionaisData = await profissionaisRes.json();
    console.log(`   - Total de profissionais cadastrados: ${profissionaisData.data.length}`);
    const targetPro = profissionaisData.data[0];
    if (!targetPro) {
      throw new Error('Nenhum profissional disponível encontrado no banco de dados!');
    }
    console.log(`     -> Profissional para agendamento teste: "${targetPro.name}" (Especialidade: ${targetPro.especialidade})`);
    console.log('   ✅ Listagem de profissionais obtida com sucesso.');

    // ----------------------------------------------------
    // FASE 4: Integração de Escrita de Ponta a Ponta (Criar, Reagendar, Cancelar)
    // ----------------------------------------------------
    console.log('\n⚡ Fase 4: Operações Transacionais E2E (Scheduling Flow)');

    // 4.1 Criar nova consulta
    const futureDate = '2026-07-15T14:00:00.000Z';
    console.log(`   - Criando agendamento de teste com "${targetPro.name}" para a data: ${futureDate}...`);
    
    const agendarRes = await fetch(`${BASE_URL}/api/client-portal/consultas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        profissionalId: targetPro.id,
        especialidade: targetPro.especialidade || 'Geral',
        tipo: 'ONLINE',
        dataHora: futureDate,
        valorCentavos: 25000,
        observacao: 'Consulta de teste para auditoria E2E no backend'
      })
    });

    if (!agendarRes.ok) {
      const errBody = await agendarRes.text();
      throw new Error(`Erro ao agendar consulta (${agendarRes.status}): ${errBody}`);
    }

    const agendadaData = await agendarRes.json();
    const consultaId = agendadaData.id;
    console.log(`   ✅ Consulta agendada com ID: "${consultaId}"`);

    // 4.2 Reagendar consulta criada
    const rescheduledDate = '2026-07-15T16:00:00.000Z';
    console.log(`   - Reagendando consulta (${consultaId}) para novo horário: ${rescheduledDate}...`);
    
    const reagendarRes = await fetch(`${BASE_URL}/api/client-portal/consultas/${consultaId}/reagendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        novaDataHora: rescheduledDate
      })
    });

    if (!reagendarRes.ok) {
      throw new Error(`Erro ao reagendar consulta (${reagendarRes.status})`);
    }
    console.log('   ✅ Reagendamento executado com sucesso.');

    // 4.3 Cancelar a consulta criada para deixar o banco limpo
    console.log(`   - Cancelando consulta temporária (${consultaId}) para restaurar integridade do banco...`);
    const cancelarRes = await fetch(`${BASE_URL}/api/client-portal/consultas/${consultaId}/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        motivo: 'Auditoria de testes concluída com sucesso'
      })
    });

    if (!cancelarRes.ok) {
      throw new Error(`Erro ao cancelar consulta (${cancelarRes.status})`);
    }
    console.log('   ✅ Consulta cancelada com sucesso.');

    console.log('\n==================================================');
    console.log('🎉 TESTE E2E DO BACK-END (PACIENTE) EXECUTADO COM 100% SUCESSO!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no teste E2E do backend (Paciente):', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
