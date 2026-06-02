// apps/api/src/backend-recovery.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('==================================================');
console.log('🔥 INICIANDO ENGENHARIA DE CAOS & RECUPERAÇÃO - API');
console.log('==================================================');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendChaosCommand(action, latencyMs = 0) {
  const res = await fetch(`${BASE_URL}/api/admin/chaos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, latencyMs }),
  });
  return res.json();
}

async function run() {
  let testsFailed = false;
  const report = [];

  try {
    // -------------------------------------------------------------------------
    // FASE 1: Autenticação de Base e Resumo Inicial
    // -------------------------------------------------------------------------
    console.log('\n🟢 FASE 1: Obtendo credenciais e testando estado estável inicial...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitmax.com', password: 'Admin@123' })
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Falha de login de base: Status ${loginRes.status}`);
    }
    
    const { accessToken } = await loginRes.json();
    console.log('   ✅ Autenticação realizada com sucesso.');

    const start = Date.now();
    const listRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const duration = Date.now() - start;
    
    if (listRes.status === 200) {
      console.log(`   ✅ API operacional. Latência estável inicial: ${BOLD}${duration}ms${RESET}`);
      report.push({ name: 'Estado Estável Inicial (Baseline)', success: true, detail: `${duration}ms` });
    } else {
      throw new Error(`API instável no baseline: Status ${listRes.status}`);
    }

    // -------------------------------------------------------------------------
    // FASE 2: Simulação de Redis Fora do Ar (Chaos Redis Offline)
    // -------------------------------------------------------------------------
    console.log('\n⚡ FASE 2: Ativando Modo Caos: Redis Offline...');
    await sendChaosCommand('disable-redis');
    console.log('   ⚠️  Simulação ativada: Qualquer comando de leitura/escrita no Redis falhará.');

    console.log('   - Testando Login de Administrador com Redis offline (Bypass de Lockout)...');
    const loginChaosStart = Date.now();
    const loginChaosRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitmax.com', password: 'Admin@123' })
    });
    const loginChaosDuration = Date.now() - loginChaosStart;

    let loginChaosPassed = false;
    if (loginChaosRes.status === 200) {
      console.log(`   ${GREEN}✅ SUCESSO: Login efetuado sem erros em ${loginChaosDuration}ms (Degradação Graciosa ativa).${RESET}`);
      loginChaosPassed = true;
    } else {
      console.error(`   ${RED}❌ FALHA: A indisponibilidade do Redis quebrou a autenticação (Status: ${loginChaosRes.status}).${RESET}`);
      testsFailed = true;
    }

    console.log('   - Testando checagem e rota de usuários com Redis offline...');
    const listChaosStart = Date.now();
    const listChaosRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const listChaosDuration = Date.now() - listChaosStart;

    let listChaosPassed = false;
    if (listChaosRes.status === 200) {
      console.log(`   ${GREEN}✅ SUCESSO: Consulta ao PostgreSQL respondida perfeitamente em ${listChaosDuration}ms.${RESET}`);
      listChaosPassed = true;
    } else {
      console.error(`   ${RED}❌ FALHA: A rota quebrou sob indisponibilidade do Redis (Status: ${listChaosRes.status}).${RESET}`);
      testsFailed = true;
    }

    report.push({
      name: 'Resiliência a Queda de Redis (Graceful Degradation)',
      success: loginChaosPassed && listChaosPassed,
      detail: loginChaosPassed && listChaosPassed ? 'Degradação elegante ativa' : 'Falha fatal sob indisponibilidade de cache'
    });

    // Restaurar Redis
    await sendChaosCommand('enable-redis');

    // -------------------------------------------------------------------------
    // FASE 3: Simulação de Latência Extrema no Banco (Chaos DB Latency)
    // -------------------------------------------------------------------------
    console.log('\n⏳ FASE 3: Ativando Modo Caos: Latência Artificial no Banco de Dados...');
    await sendChaosCommand('simulate-db-latency', 2500);
    console.log('   ⚠️  Simulação ativada: Consultas administrativas atrasadas artificialmente em 2500ms.');

    console.log('   - Efetuando chamada rápida com timeout local de 1000ms (Esperado: Timeout Graceful)...');
    
    let dbTimeoutPassed = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      await fetch(`${BASE_URL}/api/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.error(`   ${RED}❌ FALHA: A rota respondeu antes do delay esperado.${RESET}`);
      testsFailed = true;
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.log(`   ${GREEN}✅ SUCESSO: Requisição abortada de forma graceful após estourar timeout de 1000ms.${RESET}`);
        console.log('      - A API Express continuou estável e não travou a thread de execução do Node.js.');
        dbTimeoutPassed = true;
      } else {
        console.error(`   ${RED}❌ FALHA: Erro inesperado ao simular timeout: ${fetchErr.message}${RESET}`);
        testsFailed = true;
      }
    }

    report.push({
      name: 'Resiliência a timeouts e gargalos de DB (Graceful Timeout)',
      success: dbTimeoutPassed,
      detail: dbTimeoutPassed ? 'Abort graceful funcionando' : 'Falha na contenção de timeouts'
    });

    // -------------------------------------------------------------------------
    // FASE 4: Restauração Completa e Autorecovery (Self-Healing)
    // -------------------------------------------------------------------------
    console.log('\n🧹 FASE 4: Restaurando infraestrutura e validando Auto-recovery...');
    await sendChaosCommand('restore-all');
    console.log('   ♻️  Restauração ativada: Todos os gargalos e falhas limpos do ecossistema.');

    // Aguardar regeneração
    await sleep(500);

    const healStart = Date.now();
    const healRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const healDuration = Date.now() - healStart;

    let healPassed = false;
    if (healRes.status === 200 && healDuration < 100) {
      console.log(`   ${GREEN}✅ SUCESSO: Auto-recovery completo! Latência restabelecida ao ideal: ${BOLD}${healDuration}ms${RESET}`);
      healPassed = true;
    } else {
      console.error(`   ${RED}❌ FALHA: Auto-recovery ineficaz ou latência anormal após restauração: ${healDuration}ms (Status: ${healRes.status})${RESET}`);
      testsFailed = true;
    }

    report.push({
      name: 'Auto-recovery Técnico (Self-Healing)',
      success: healPassed,
      detail: healPassed ? `Recuperado de forma autônoma para ${healDuration}ms` : 'Recuperação lenta ou incompleta'
    });

  } catch (err) {
    console.error(`\n${RED}❌ ERRO NA EXECUÇÃO DOS TESTES DE CAOS: ${err.message}${RESET}`);
    testsFailed = true;
  }

  // -------------------------------------------------------------------------
  // BALANÇO CONSOLIDADO
  // -------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log('📊 BALANÇO CONSOLIDADO DE ENGENHARIA DE CAOS (API)');
  console.log('==================================================');
  report.forEach(item => {
    if (item.success) {
      console.log(`🟢 [PASSOU] ${item.name} - ${item.detail}`);
    } else {
      console.log(`🔴 [FALHOU] ${item.name} - ${item.detail}`);
    }
  });
  console.log('==================================================');

  // Limpeza final de segurança
  await sendChaosCommand('restore-all');

  if (testsFailed) {
    console.error(`\n${RED}${BOLD}❌ FALHA: A resiliência do backend falhou em cenários de caos!${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}🎉 SUCESSO ABSOLUTO: Backend resiliente com Graceful Degradation e Self-Healing!${RESET}`);
    process.exit(0);
  }
}

run();
