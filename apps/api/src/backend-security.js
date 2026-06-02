// backend-security.js
// Script de Testes de Segurança (OWASP Top 10) para as APIs do FITMAX
require('dotenv').config();

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
  console.log('🛡️  INICIANDO AUDITORIA DE SEGURANÇA (OWASP) - BACKEND');
  console.log('==================================================\n');

  try {
    let adminToken = '';
    let clientToken = '';

    // ----------------------------------------------------
    // FASE 1: OWASP A05:2021-Security Misconfiguration (Helmet & CORS Headers)
    // ----------------------------------------------------
    console.log('🌐 Fase 1: Auditoria de Cabeçalhos HTTP de Endurecimento (OWASP A05)');
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
    // FASE 2: OWASP A01:2021-Broken Access Control (RBAC)
    // ----------------------------------------------------
    console.log('\n🔐 Fase 2: Blindagem de Controle de Acesso e RBAC (OWASP A01)');

    // 2.1 Sem Token JWT
    const noTokenRes = await fetch(`${BASE_URL}/api/admin/usuarios`);
    console.log(`   - Requisição sem JWT -> Status HTTP esperado: 401 | Recebido: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada sem token!');
    }
    console.log('   ✅ Bloqueio de requisições anônimas verificado.');

    // 2.2 Autenticação Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (!adminLoginRes.ok) throw new Error('Falha ao autenticar admin.');
    const adminData = await adminLoginRes.json();
    adminToken = adminData.accessToken;

    // 2.3 Autenticação Cliente
    const clientLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD })
    });
    if (!clientLoginRes.ok) throw new Error('Falha ao autenticar cliente.');
    const clientData = await clientLoginRes.json();
    clientToken = clientData.accessToken;

    // 2.4 Acesso Admin com Token de Cliente (RBAC test)
    const clientRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    console.log(`   - Cliente tentando acessar rotas Admin -> Status esperado: 403 | Recebido: ${clientRbacRes.status}`);
    if (clientRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Cliente obteve acesso não autorizado (Falta RBAC)!');
    }
    console.log('   ✅ Bloqueio de privilégios insuficientes (RBAC) ativo.');

    // ----------------------------------------------------
    // FASE 3: OWASP A03:2021-Injection (SQL Injection & NoSQL Injection)
    // ----------------------------------------------------
    console.log('\n🎯 Fase 3: Imunidade a SQL Injection (OWASP A03)');

    // Dispara payloads clássicos de injeção SQL no campo search
    const sqliPayload = "' OR '1'='1' --";
    console.log(`   - Tentando SQL Injection no filtro search: "${sqliPayload}"...`);
    const sqliRes = await fetch(`${BASE_URL}/api/admin/usuarios?search=${encodeURIComponent(sqliPayload)}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!sqliRes.ok) {
      throw new Error(`Falha na resposta do servidor para injeção SQL (${sqliRes.status})`);
    }
    const sqliData = await sqliRes.json();
    console.log(`   - Status HTTP: ${sqliRes.status}`);
    console.log(`   - Usuários retornados sob injeção: ${sqliData.data.length} usuários.`);
    
    // Se o payload passasse, ele burlaria o filtro retornando TODOS os usuários ativos (11).
    // Como está parametrizado, ele busca literalmente o texto e retorna 0 usuários.
    if (sqliData.data.length > 0) {
      throw new Error('Falha de Segurança: O payload SQL Injection obteve retorno de dados!');
    }
    console.log('   ✅ Consulta parametrizada pelo Prisma ORM imunizou o banco contra injeção SQL.');

    // ----------------------------------------------------
    // FASE 4: OWASP A07:2021-Identification and Authentication Failures (Brute Force Defense)
    // ----------------------------------------------------
    console.log('\n🛡️  Fase 4: Proteção contra Força Bruta / Brute-Force (OWASP A07)');
    console.log('   - Disparando requisições paralelas e repetidas de login (flooding)...');

    // Executa 12 requisições paralelas de login de forma concorrente para bater o limite de 10 do authLimiter
    const loginAttempts = Array.from({ length: 15 }, () => 
      fetch(`${BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: 'IncorrectPasswordForStress' })
      })
    );

    const results = await Promise.all(loginAttempts);
    const statuses = results.map(r => r.status);
    const hasRateLimit = statuses.includes(429);

    console.log(`   - Códigos HTTP retornados: [${statuses.join(', ')}]`);
    
    if (!hasRateLimit) {
      throw new Error('Falha de Segurança: O middleware authLimiter falhou em bloquear acessos de força bruta (Falta HTTP 429)!');
    }
    console.log('   ✅ Ataque de força bruta contido com sucesso! HTTP 429 retornado.');

    console.log('\n==================================================');
    console.log('🎉 AUDITORIA DE SEGURANÇA DO BACKEND CONCLUÍDA - 100% OK!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu uma falha na auditoria de segurança:', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
