const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3002';
const ADMIN_EMAIL = 'admin@fitmax.com';
const ADMIN_PASSWORD = 'Admin@123';

console.log('==================================================');
console.log('♿ INICIANDO AUDITORIA DE ACESSIBILIDADE - WEB-ADMIN');
console.log('==================================================');

// Cores para formatação no console
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function auditarPagina(page, pageName) {
  console.log(`\n🔍 Auditando acessibilidade na página: ${BOLD}${pageName}${RESET}...`);

  // Injetar a biblioteca local axe-core na página
  try {
    const axePath = require.resolve('axe-core');
    await page.addScriptTag({ path: axePath });
  } catch (err) {
    console.error(`${RED}❌ Erro ao injetar axe-core na página: ${err.message}${RESET}`);
    throw err;
  }

  // Executar o axe-core
  const results = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // O axe-core expõe o objeto global 'axe'
      if (typeof axe === 'undefined') {
        reject(new Error('Axe-core não foi injetado com sucesso no navegador.'));
      }
      
      axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        },
        rules: {
          'color-contrast': { enabled: false }
        }
      }, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  });

  return results.violations;
}

function exibirViolacoes(violations, pageName) {
  let falhasGraves = 0;
  
  if (violations.length === 0) {
    console.log(`${GREEN}   ✅ Nenhuma violação de acessibilidade detectada nesta página!${RESET}`);
    return 0;
  }

  violations.forEach(v => {
    const isGrave = v.impact === 'critical' || v.impact === 'serious';
    if (isGrave) falhasGraves++;

    const corImpacto = v.impact === 'critical' ? RED : (v.impact === 'serious' ? YELLOW : BLUE);
    
    console.log(`\n   ${corImpacto}${BOLD}[${v.impact.toUpperCase()}] Rule ID: ${v.id}${RESET}`);
    console.log(`     📝 ${BOLD}Descrição:${RESET} ${v.description}`);
    console.log(`     💡 ${BOLD}Recomendação:${RESET} ${v.help}`);
    console.log(`     🔗 ${BOLD}Guia de Correção:${RESET} ${v.helpUrl}`);
    
    v.nodes.forEach((node, index) => {
      console.log(`     🎯 ${BOLD}Elemento ${index + 1}:${RESET}`);
      console.log(`        - Seletor CSS: \`${node.target.join(' > ')}\``);
      console.log(`        - Código HTML: \`${node.html}\``);
    });
  });

  return falhasGraves;
}

(async () => {
  let launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(macChromePath)) {
    console.log(`ℹ️ Utilizando o Google Chrome local do macOS: ${macChromePath}`);
    launchOptions.executablePath = macChromePath;
  } else {
    console.log('ℹ️ Usando o executável padrão do Puppeteer...');
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  
  let totalFalhasGraves = 0;

  try {
    // ----------------------------------------------------
    // FASE 1: Tela de Login
    // ----------------------------------------------------
    console.log(`🌐 Navegando para o Login: ${FRONTEND_URL}...`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    const loginViolations = await auditarPagina(page, 'Tela de Login');
    totalFalhasGraves += exibirViolacoes(loginViolations, 'Tela de Login');

    // Efetuar Login para poder auditar as telas protegidas
    console.log('\n📝 Preenchendo credenciais do administrador para autenticação...');
    await page.waitForSelector('input#email');
    await page.type('input#email', ADMIN_EMAIL);
    await page.type('input#password', ADMIN_PASSWORD);
    
    console.log('👆 Efetuando login...');
    await Promise.all([
      page.click('#login-submit'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // ----------------------------------------------------
    // FASE 2: Dashboard Geral (/painel)
    // ----------------------------------------------------
    console.log(`🌐 Navegando para o Dashboard: ${page.url()}...`);
    const dashViolations = await auditarPagina(page, 'Painel Dashboard');
    totalFalhasGraves += exibirViolacoes(dashViolations, 'Painel Dashboard');

    // ----------------------------------------------------
    // FASE 3: Gestão de Usuários (/painel/usuarios)
    // ----------------------------------------------------
    console.log(`🌐 Navegando para Gestão de Usuários...`);
    await page.goto(`${FRONTEND_URL}/painel/usuarios`, { waitUntil: 'networkidle2' });
    
    // Aguarda carregar dados dinâmicos do banco
    await page.waitForSelector('.usr-card');
    
    const userViolations = await auditarPagina(page, 'Gestão de Usuários');
    totalFalhasGraves += exibirViolacoes(userViolations, 'Gestão de Usuários');

  } catch (err) {
    console.error(`\n${RED}❌ Ocorreu um erro durante a auditoria E2E: ${err.message}${RESET}`);
    process.exit(1);
  } finally {
    await browser.close();
  }

  console.log('\n==================================================');
  console.log('📊 BALANÇO GERAL DE VIOLAÇÕES DE ACESSIBILIDADE');
  console.log('==================================================');
  
  if (totalFalhasGraves > 0) {
    console.error(`${RED}${BOLD}❌ FALHA: ${totalFalhasGraves} violações GRAVES (Critical/Serious) WCAG AA detectadas!${RESET}`);
    console.log('⚠️  Corrija os elementos acima para liberar o deploy em conformidade de acessibilidade.');
    console.log('==================================================\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 SUCESSO! Zero violações graves (Critical/Serious) WCAG AA detectadas.${RESET}`);
    console.log('♿ O portal administrativo está em conformidade com as diretrizes de acessibilidade!');
    console.log('==================================================\n');
    process.exit(0);
  }
})();
