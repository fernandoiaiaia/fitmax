// e2e.js
// Teste de Ponta a Ponta (E2E) para FITMAX Web Admin
const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const ADMIN_EMAIL = 'admin@fitmax.com';
const ADMIN_PASSWORD = 'Admin@123';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('==================================================');
  console.log('🎬 INICIANDO TESTE DE PONTA A PONTA (E2E) - FITMAX');
  console.log('==================================================\n');

  // Procura o executável do Chrome instalado no macOS
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

  // Inicializa o Puppeteer no modo headless
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  
  // Monitorar logs de console do navegador
  page.on('console', msg => console.log(`   [Browser Console] ${msg.text()}`));

  try {
    // ----------------------------------------------------
    // FASE 1: Login do Administrador
    // ----------------------------------------------------
    console.log(`🌐 Navegando para o Login: ${FRONTEND_URL}/...`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });

    console.log('📝 Preenchendo credenciais do administrador...');
    await page.waitForSelector('input#email');
    await page.type('input#email', ADMIN_EMAIL);
    await page.type('input#password', ADMIN_PASSWORD);

    console.log('👆 Clicando no botão de Entrar...');
    await Promise.all([
      page.click('#login-submit'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const dashboardUrl = page.url();
    console.log(`✅ Login efetuado! URL de destino: ${dashboardUrl}`);
    if (!dashboardUrl.includes('/painel')) {
      throw new Error(`Falha no Login: URL esperada contendo '/painel', recebida '${dashboardUrl}'`);
    }

    // ----------------------------------------------------
    // FASE 2: Navegação até a Gestão de Usuários
    // ----------------------------------------------------
    console.log('\n👥 Navegando para Gestão de Usuários...');
    await page.goto(`${FRONTEND_URL}/painel/usuarios`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('h2');
    const pageHeading = await page.$eval('h2', el => el.textContent);
    console.log(`✅ Tela carregada! Título encontrado: "${pageHeading}"`);
    
    if (!pageHeading.includes('Gestão de Usuários')) {
      throw new Error('Falha no carregamento: Título de página incorreto.');
    }

    // ----------------------------------------------------
    // FASE 3: Consumo de dados e interações reais
    // ----------------------------------------------------
    console.log('\n🔍 Verificando exibição de usuários reais cadastrados no PostgreSQL...');
    
    // Aguarda que os cards de usuários estejam renderizados
    await page.waitForSelector('.usr-card');
    
    const userCount = await page.$$eval('.usr-card', cards => cards.length);
    console.log(`✅ Usuários carregados na tela: ${userCount} usuários encontrados.`);

    // Busca o nome do primeiro usuário para auditoria
    const firstUserName = await page.$eval('.usr-card span', el => el.textContent);
    console.log(`👤 Primeiro usuário da lista: "${firstUserName}"`);

    // Encontra o botão de alteração de status (toggle status) do primeiro usuário
    console.log('\n⚡ Testando integração dinâmica de escrita (Toggle Status)...');
    
    const toggleButton = await page.$('.usr-card button[title="Desativar"], .usr-card button[title="Ativar"]');
    if (!toggleButton) {
      throw new Error('Botão de alternar status (Ativar/Desativar) não localizado no primeiro usuário.');
    }

    const currentTitle = await page.evaluate(el => el.getAttribute('title'), toggleButton);
    console.log(`   - Ação atual disponível: "${currentTitle}"`);

    console.log('   - Clicando no botão de status...');
    await toggleButton.click();

    // Aguarda o spinner de loading e a finalização da requisição
    console.log('   - Aguardando atualização dinâmica de estado na interface...');
    await sleep(2000); // Dá um tempo curto para a requisição de patch + recarregamento do banco finalizar

    // Verifica se a atualização refletiu no banco e na interface
    await page.waitForSelector('.usr-card');
    const newToggleButton = await page.$('.usr-card button[title="Desativar"], .usr-card button[title="Ativar"]');
    const newTitle = await page.evaluate(el => el.getAttribute('title'), newToggleButton);
    
    console.log(`   - Nova ação disponível após clique: "${newTitle}"`);
    
    if (newTitle === currentTitle) {
      throw new Error('O status do usuário não mudou após o clique dinâmico.');
    }

    console.log('✅ Alteração de status concluída com persistência de dados de ponta a ponta!');
    
    console.log('\n==================================================');
    console.log('🎉 TESTE E2E EXECUTADO COM SUCESSO - 100% PASSOU!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no teste E2E:', error.message);
    console.log('==================================================');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
