// pro-backend-security.js
// Script de Auditoria de Segurança (OWASP Top 10) para as APIs do FitMax Professional
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

const PRO_EMAIL = 'rafael.costa@fitmax.com';
const PRO_PASSWORD = 'Pro@123456';
const CLIENT_EMAIL = 'carlos.mendes@email.com';
const CLIENT_PASSWORD = 'Client@123';

(async () => {
  console.log('==================================================');
  console.log('🛡️  INICIANDO AUDITORIA DE SEGURANÇA (OWASP) - PRO BACKEND');
  console.log('==================================================\n');

  try {
    let proToken = '';
    let clientToken = '';

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
    console.log('   - Acessando endpoint do Profissional (/pro/me) sem Token...');
    const noTokenRes = await fetch(`${BASE_URL}/api/pro/me`);
    console.log(`     -> Status HTTP recebido: ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error('Falha de Segurança: Requisição deveria ser barrada sem token com 401!');
    }
    console.log('   ✅ Bloqueio de requisições anônimas verificado.');

    // 2.2 Autenticação Professional para obter Token
    console.log('   - Efetuando login do Profissional...');
    const proLoginRes = await fetch(`${BASE_URL}/api/auth/pro/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: PRO_EMAIL, password: PRO_PASSWORD })
    });
    if (!proLoginRes.ok) throw new Error('Falha ao autenticar profissional.');
    const proData = await proLoginRes.json();
    proToken = proData.accessToken;

    // 2.3 Autenticação Cliente para obter Token
    console.log('   - Efetuando login do Cliente...');
    const clientLoginRes = await fetch(`${BASE_URL}/api/auth/client/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: CLIENT_PASSWORD })
    });
    if (!clientLoginRes.ok) throw new Error('Falha ao autenticar cliente.');
    const clientData = await clientLoginRes.json();
    clientToken = clientData.accessToken;

    // 2.4 Acesso a endpoints do profissional usando Token de Cliente (Vazamento Cross-Role)
    console.log('   - Cliente tentando acessar endpoints do Profissional (/pro/me)...');
    const clientRbacRes = await fetch(`${BASE_URL}/api/pro/me`, {
      headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    console.log(`     -> Status HTTP recebido: ${clientRbacRes.status}`);
    if (clientRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Cliente obteve acesso indevido ou código inadequado (RBAC falhou)!');
    }
    console.log('   ✅ Bloqueio de acesso a Profissional com Token de Cliente verificado.');

    // 2.5 Acesso a endpoints de Admin usando Token de Profissional
    console.log('   - Profissional tentando acessar rotas Admin (/admin/usuarios)...');
    const proRbacRes = await fetch(`${BASE_URL}/api/admin/usuarios`, {
      headers: { 'Authorization': `Bearer ${proToken}` }
    });
    console.log(`     -> Status HTTP recebido: ${proRbacRes.status}`);
    if (proRbacRes.status !== 403) {
      throw new Error('Falha de Segurança: Profissional obteve privilégios não autorizados!');
    }
    console.log('   ✅ Bloqueio de acesso a Admin com Token de Profissional verificado.');


    // ----------------------------------------------------
    // FASE 3: OWASP A10:2021-Server-Side Request Forgery (SSRF Defenses)
    // ----------------------------------------------------
    console.log('\n📡 Fase 3: Defesas contra Server-Side Request Forgery (OWASP A10)');

    // 3.1 Tentando enviar um caminho local / interno como imagemUrl
    const localSspfPayload = '/e2e-img.png';
    console.log(`   - Criando post no feed enviando imagemUrl local: "${localSspfPayload}"...`);
    const localSspfRes = await fetch(`${BASE_URL}/api/pro/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proToken}`
      },
      body: JSON.stringify({
        topico: 'Ataque SSRF local',
        caption: 'Tentando burlar validação',
        imagemUrl: localSspfPayload,
        aspectRatio: 1.0
      })
    });
    console.log(`     -> Status HTTP recebido: ${localSspfRes.status}`);
    if (localSspfRes.status !== 422) {
      throw new Error('Falha de Segurança: A rota de feed deveria bloquear URLs locais de imagens com HTTP 422!');
    }
    console.log('   ✅ Bloqueio de caminhos de arquivos locais de imagem bem-sucedido (OWASP A10).');

    // 3.2 Tentando enviar um loopback interno como imagemUrl
    const loopbackSspfPayload = 'http://127.0.0.1:3001/api/admin/usuarios';
    console.log(`   - Criando post no feed enviando imagemUrl loopback interno: "${loopbackSspfPayload}"...`);
    const loopbackSspfRes = await fetch(`${BASE_URL}/api/pro/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${proToken}`
      },
      body: JSON.stringify({
        topico: 'Ataque SSRF loopback',
        caption: 'Tentando ler dados de admin',
        imagemUrl: loopbackSspfPayload,
        aspectRatio: 1.0
      })
    });
    console.log(`     -> Status HTTP recebido: ${loopbackSspfRes.status}`);
    if (loopbackSspfRes.status !== 422) {
      throw new Error('Falha de Segurança: A rota de feed deveria bloquear URLs loopback internos com HTTP 422!');
    }
    console.log('   ✅ Bloqueio de loopback interno para imagemUrl bem-sucedido (OWASP A10).');


    // ----------------------------------------------------
    // FASE 4: OWASP A07:2021-Identification and Authentication Failures (Brute Force Defense)
    // ----------------------------------------------------
    console.log('\n🛡️  Fase 4: Proteção contra Força Bruta / Brute-Force (OWASP A07)');
    console.log('   - Disparando requisições paralelas e repetidas de login do profissional (flooding)...');

    // Executa 12 requisições paralelas de login de forma concorrente para bater o limite de 10 do authLimiter
    // Passamos o header x-no-bypass para testar o rate limiter real
    const loginAttempts = Array.from({ length: 15 }, () => 
      fetch(`${BASE_URL}/api/auth/pro/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-no-bypass': 'true'
        },
        body: JSON.stringify({ email: 'nonexistent_pro_security_test@fitmax.com', password: 'IncorrectPasswordForProStress' })
      })
    );

    const results = await Promise.all(loginAttempts);
    const statuses = results.map(r => r.status);
    const hasRateLimit = statuses.includes(429);

    console.log(`   - Códigos HTTP retornados: [${statuses.join(', ')}]`);
    
    if (!hasRateLimit) {
      throw new Error('Falha de Segurança: O middleware authLimiter falhou em bloquear acessos de força bruta ao profissional (Falta HTTP 429)!');
    }
    console.log('   ✅ Ataque de força bruta contido com sucesso! HTTP 429 retornado.');

    console.log('\n==================================================');
    console.log('🎉 AUDITORIA DE SEGURANÇA DO PRO BACKEND CONCLUÍDA - 100% OK!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu uma falha na auditoria de segurança do pro backend:', error.message);
    console.log('==================================================');
    process.exit(1);
  }
})();
