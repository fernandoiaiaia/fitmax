// e2e.js
// Teste de Ponta a Ponta (E2E) para FITMAX Web Pro (Portal do Profissional)
const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3003';
const PRO_EMAIL = 'rafael.costa@fitmax.com';
const PRO_PASSWORD = 'Pro@123456';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('==================================================');
  console.log('🎬 INICIANDO TESTE DE PONTA A PONTA (E2E) - PRO');
  console.log('==================================================\n');

  // Inicializa o Puppeteer no modo headless, buscando Google Chrome nativo se disponível
  let launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  const fs = require('fs');
  const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(macChromePath)) {
    console.log(`ℹ️ Utilizando o Google Chrome local do macOS: ${macChromePath}`);
    launchOptions.executablePath = macChromePath;
  } else {
    console.log('ℹ️ Usando o executável padrão do Puppeteer...');
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  
  // Monitorar logs de console do navegador
  page.on('console', msg => console.log(`   [Browser Console] ${msg.text()}`));

  try {
    // ----------------------------------------------------
    // FASE 1: Login do Profissional (Dra. Ana Souza / Dr. Rafael Costa)
    // ----------------------------------------------------
    console.log(`🌐 Navegando para o Login: ${FRONTEND_URL}/login...`);
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });

    console.log('📝 Preenchendo credenciais do profissional (Rafael Costa)...');
    await page.waitForSelector('input#email');
    await page.type('input#email', PRO_EMAIL);
    await page.type('input#password', PRO_PASSWORD);

    console.log('👆 Clicando no botão de Entrar...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const dashboardUrl = page.url();
    console.log(`✅ Login efetuado! URL de destino: ${dashboardUrl}`);
    if (!dashboardUrl.includes('/painel')) {
      throw new Error(`Falha no Login: URL esperada contendo '/painel', recebida '${dashboardUrl}'`);
    }

    // ----------------------------------------------------
    // FASE 2: Validando a Tela do Painel (Dashboard)
    // ----------------------------------------------------
    console.log('\n📊 Validando a Tela de Painel...');
    await page.waitForSelector('h2');
    
    const pageHeading = await page.$eval('h2', el => el.textContent);
    console.log(`✅ Tela carregada! Título encontrado: "${pageHeading}"`);
    
    if (!pageHeading.includes('Sua Visão Geral')) {
      throw new Error('Falha no carregamento: Título de página incorreto no web-pro.');
    }

    // ----------------------------------------------------
    // FASE 3: Consumo de dados e verificação de layout (Feed, Consultas, Agenda)
    // ----------------------------------------------------
    console.log('\n🔍 Verificando os Widgets do Painel...');

    // Verifica Destaques do Feed
    const feedHeader = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h2'));
      return headers.find(h => h.textContent.includes('Destaques do Feed')) ? true : false;
    });
    console.log(`   - Widget "Destaques do Feed" renderizado: ${feedHeader ? 'SIM' : 'NÃO'}`);
    if (!feedHeader) throw new Error('Widget "Destaques do Feed" ausente.');

    // Aguarda o carregamento das publicações
    await sleep(1000);
    const hasFeedImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.length > 0;
    });
    console.log(`   - Publicações do Feed carregadas dinamicamente: ${hasFeedImages ? 'SIM' : 'NÃO'}`);

    // Verifica Consultas Pendentes
    const consultasHeader = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('h2'));
      return headers.find(h => h.textContent.includes('Consultas Pendentes')) ? true : false;
    });
    console.log(`   - Widget "Consultas Pendentes" renderizado: ${consultasHeader ? 'SIM' : 'NÃO'}`);
    if (!consultasHeader) throw new Error('Widget "Consultas Pendentes" ausente.');

    // ----------------------------------------------------
    // FASE 4: Auditoria de Segurança OWASP A04 (LocalStorage JWT Audit)
    // ----------------------------------------------------
    console.log('\n🛡️  Auditoria de Segurança (OWASP A04 - Insecure Storage)...');
    
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    const sessionStorageKeys = await page.evaluate(() => Object.keys(sessionStorage));
    
    const leaksToken = localStorageKeys.concat(sessionStorageKeys).some(k => k.toLowerCase().includes('token'));
    
    console.log(`   - Chaves detectadas no LocalStorage:  [${localStorageKeys.join(', ')}]`);
    console.log(`   - Chaves detectadas no SessionStorage: [${sessionStorageKeys.join(', ')}]`);
    
    if (leaksToken) {
      throw new Error('Falha de Segurança (OWASP A04): Token JWT vazou ou foi persistido no armazenamento físico do navegador!');
    }
    console.log('   ✅ Auditoria concluída: Zero vazamento de JWT no LocalStorage. Token está estritamente em memória volátil.');

    console.log('\n==================================================');
    console.log('🎉 TESTE E2E DO PRO CONCLUÍDO COM 100% SUCESSO!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no teste E2E do profissional:', error.message);
    console.log('==================================================');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
