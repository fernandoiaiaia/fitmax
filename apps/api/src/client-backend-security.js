// client-backend-security.js
// Script de Auditoria de Segurança (OWASP Top 10) para as APIs do FitMax Client (web-client)
require('dotenv').config();

// Global intercept fetch to inject the bypass header by default for normal operations
const originalFetch = global.fetch;
global.fetch = function (url, options = {}) {
  options.headers = options.headers || {};
  if (!options.headers['x-no-bypass']) {
    options.headers['x-bypass-rate-limit'] = 'true';
  } else {
    delete options.headers['x-no-bypass'];
  }
  return originalFetch(url, options);
};

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

const CLIENT_EMAIL = 'carlos.mendes@email.com';
const CLIENT_PASSWORD = 'Client@123';
const PRO_EMAIL = 'rafael.costa@fitmax.com';
const PRO_PASSWORD = 'Pro@123456';

(async () => {
  console.log('==================================================');
  console.log('🛡️  INICIANDO AUDITORIA DE SEGURANÇA (OWASP) - PACIENTE BACKEND');
  console.log('==================================================\n');

  try {
    let clientToken = '';
    let proToken = '';

    // ----------------------------------------------------
    // FASE 1: OWASP A05:2021-Security Misconfiguration (Helmet & CORS Headers)
    // ----------------------------------------------------
    console.log('🌐 Fase 1: Cabeçalhos HTTP de Endurecimento (OWASP A05)');
    const headersRes = await fetch(`${BASE_URL}/health`);
    const headers = headersRes.headers;

    // Clickjacking defense (Helmet)
    const xfo = headers.get('x-frame-options');
    console.log(`   - X-Frame-Options (Clickjacking):      "${xfo}"`);
    if (xfo !== 'SAMEORIGIN' && xfo !== 'DENY') {
      throw new Error('Falha de Segurança: Cabeçalho X-Frame-Options ausente ou inseguro!');
    }
    console.log('   ✅ Proteção contra Clickjacking ativa.');

    // MIME sniffing defense
    const xcto = headers.get('x-content-type-options');
    console.log(`   - X-Content-Type-Options (Sniffing):  "${xcto}"`);
    if (xcto !== 'nosniff') {
      throw new Error('Falha de Segurança: X-Content-Type-Options ausente ou inadequado!');
    }
    console.log('   ✅ Proteção contra Sniffing de tipo MIME ativa.');

    // CSP header check
    const csp = headers.get('content-security-policy');
    console.log(`   - Content-Security-Policy:            "${csp ? 'DEFINIDA (OK)' : 'AUSENTE'}"`);
    if (!csp) {
      throw new Error('Falha de Segurança: Cabeçalho de CSP (Content-Security-Policy) ausente!');
    }
    console.log('   ✅ Content-Security-Policy ativa.');


    // ----------------------------------------------------
    // FASE 2: OWASP A01:2021-Broken Access Control & RBAC
    // ----------------------------------------------------
    console.log('\n🔐 Fase 2: Blindagem de Controle de Acesso e RBAC (OWASP A01)');

    // 2.1 Acesso sem Token JWT
    console.log('   - Acessando endpoint do Paciente (/client-portal/consultas/stats) sem Token...');
    const noTokenRes = await fetch(`${BASE_URL}/api/client-portal/consultas/stats`);
    console.log(`     -> Status HTTP recebido: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada sem token com 401!');
    }
    console.log('   ✅ Bloqueio de requisições anônimas verificado.');

    // 2.2 Autenticação Patient para obter Token
    console.log('   - Efetuando login do Paciente...');
    const clientLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD })
    });
    if (!clientLoginRes.ok) throw new Error('Falha ao autenticar paciente.');
    const clientData = await clientLoginRes.json();
    clientToken = clientData.accessToken;

    // 2.3 Autenticação Professional para obter Token
    console.log('   - Efetuando login do Profissional...');
    const proLoginRes = await fetch(`${BASE_URL}/api/auth/pro/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: PRO_EMAIL, password: PRO_PASSWORD })
    });
    if (!proLoginRes.ok) throw new Error('Falha ao autenticar profissional.');
    const proData = await proLoginRes.json();
    proToken = proData.accessToken;

    // 2.4 Acesso a endpoints do paciente usando Token de Profissional (Vazamento Cross-Role)
    console.log('   - Profissional tentando acessar endpoints do Paciente (/client-portal/consultas/stats)...');
    const proRbacRes = await fetch(`${BASE_URL}/api/client-portal/consultas/stats`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    console.log(`     -> Status HTTP recebido: ${proRbacRes.status}`);
    if (proRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Profissional obteve acesso indevido a dados de Paciente (RBAC falhou)!');
    }
    console.log('   ✅ Bloqueio de acesso a Paciente com Token de Profissional verificado.');

    // 2.5 Acesso a endpoints de Admin usando Token de Paciente
    console.log('   - Paciente tentando acessar rotas Admin (/admin/usuarios)...');
    const clientRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    console.log(`     -> Status HTTP recebido: ${clientRbacRes.status}`);
    if (clientRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Paciente obteve privilégios não autorizados administrativos!');
    }
    console.log('   ✅ Bloqueio de acesso a Admin com Token de Paciente verificado.');


    // ----------------------------------------------------
    // FASE 3: OWASP A03:2021-Injection (SQL Injection Containment)
    // ----------------------------------------------------
    console.log('\n💉 Fase 3: Validação de Blindagem contra SQL Injection (OWASP A03)');

    // Simula uma tentativa de injeção clássica SQL no parâmetro search de consultas do paciente
    const sqlInjectionPayload = "carlos' OR '1'='1";
    console.log(`   - Filtrando consultas do paciente com payload injetável: "${sqlInjectionPayload}"...`);
    const sqlRes = await fetch(`${BASE_URL}/api/client-portal/consultas?search=${encodeURIComponent(sqlInjectionPayload)}`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });

    if (!sqlRes.ok) {
      throw new Error(`A API falhou ou caiu ao processar caracteres especiais (Status: ${sqlRes.status})`);
    }

    const sqlData = await sqlRes.json();
    console.log(`     -> Total de consultas retornadas: ${sqlData.meta.total}`);
    
    // Se a injeção tivesse funcionado, a cláusula OR '1'='1' tornaria o where verdadeiro para todos,
    // retornando todas as consultas do banco ao invés de zero (pois não existe profissional com esse nome)
    if (sqlData.meta.total > 0) {
      throw new Error('Falha crítica de segurança: SQL Injection foi executado e retornou dados vazados!');
    }
    console.log('   ✅ Blindagem de SQL Injection bem-sucedida! Parâmetro escapado com segurança pelo ORM.');


    // ----------------------------------------------------
    // FASE 4: OWASP A07:2021-Identification and Authentication Failures (Brute Force Defense)
    // ----------------------------------------------------
    console.log('\n🛡️  Fase 4: Proteção contra Força Bruta / Brute-Force (OWASP A07)');
    console.log('   - Disparando requisições paralelas e repetidas de login do paciente (flooding)...');

    // Executa 15 requisições paralelas de login de forma concorrente para bater o limite do authLimiter
    // Passamos o header x-no-bypass para testar o rate limiter real
    const loginAttempts = Array.from({ length: 15 }, () => 
      fetch(`${BASE_URL}/api/auth/client/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-no-bypass': 'true'
        },
        body: JSON.stringify({ email: 'nonexistent_client_security_test@fitmax.com', password: 'IncorrectPasswordForClientStress' })
      })
    );

    const results = await Promise.all(loginAttempts);
    const statuses = results.map(r => r.status);
    const hasRateLimit = statuses.includes(429);

    console.log(`   - Códigos HTTP retornados: [${statuses.join(', ')}]`);
    
    if (!hasRateLimit) {
      throw new Error('Falha de Segurança: O middleware authLimiter falhou em bloquear acessos de força bruta ao paciente (Falta HTTP 429)!');
    }
    console.log('   ✅ Ataque de força bruta contido com sucesso! HTTP 429 retornado.');

    console.log('\n==================================================');
    console.log('🎉 AUDITORIA DE SEGURANÇA DO CLIENT BACKEND CONCLUÍDA - 100% OK!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu uma falha na auditoria de segurança do client backend:', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
