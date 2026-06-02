// visual-regression.js
// Teste de Regressão Visual E2E (Item 11) para FITMAX Web Admin
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const { PNG } = require('pngjs');

const FRONTEND_URL = 'http://localhost:3002';
const ADMIN_EMAIL = 'admin@fitmax.com';
const ADMIN_PASSWORD = 'Admin@123';

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASELINES_DIR = path.join(SCREENSHOTS_DIR, 'baselines');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const DIFFS_DIR = path.join(SCREENSHOTS_DIR, 'diffs');

// Cria os diretórios necessários de screenshots
[SCREENSHOTS_DIR, BASELINES_DIR, CURRENT_DIR, DIFFS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function compareImages(baselinePath, currentPath, diffPath) {
  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(currentPath));
  const { width, height } = img1;

  if (img1.width !== img2.width || img1.height !== img2.height) {
    console.log(`      ❌ Erro: As dimensões da imagem não coincidem! Baseline: ${img1.width}x${img1.height} | Atual: ${img2.width}x${img2.height}`);
    return { mismatchCount: width * height, mismatchPercentage: 100 };
  }

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1, includeAA: true }
  );

  const totalPixels = width * height;
  const mismatchPercentage = (numDiffPixels / totalPixels) * 100;

  if (numDiffPixels > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return { mismatchCount: numDiffPixels, mismatchPercentage };
}

(async () => {
  console.log('==================================================');
  console.log('📸 INICIANDO AUDITORIA DE REGRESSÃO VISUAL - ADMIN');
  console.log('==================================================\n');

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

  let failed = false;

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  try {
    const screens = [
      {
        name: 'login-page',
        navigate: async () => {
          console.log(`🌐 [Rota] Acessando a tela de Login (${FRONTEND_URL})...`);
          await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
          await page.waitForSelector('input#email');
        }
      },
      {
        name: 'dashboard-page',
        navigate: async () => {
          console.log(`\n🌐 [Rota] Efetuando login e acessando o Dashboard...`);
          await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
          await page.waitForSelector('input#email');
          await page.type('input#email', ADMIN_EMAIL);
          await page.type('input#password', ADMIN_PASSWORD);
          await Promise.all([
            page.click('#login-submit'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
          ]);
          // Aguarda um pequeno delay de montagem dos cards de estatísticas
          await sleep(1000);
        }
      },
      {
        name: 'usuarios-page',
        navigate: async () => {
          console.log(`\n🌐 [Rota] Navegando para a página de Gestão de Usuários...`);
          await page.goto(`${FRONTEND_URL}/painel/usuarios`, { waitUntil: 'networkidle2' });
          await page.waitForSelector('.usr-card');
          // Aguarda renderizar todos os usuários na lista
          await sleep(1500);
        }
      }
    ];

    for (const screenInfo of screens) {
      // 1. Navega para a página alvo
      await screenInfo.navigate();

      // 2. Tira prints para cada viewport configurado (desktop / mobile)
      for (const vp of viewports) {
        console.log(`   - Capturando viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})...`);
        await page.setViewport({ width: vp.width, height: vp.height });
        await sleep(500);

        // Injeta estilo CSS para desligar todas as transições e animações (determínismo visual completo)
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              transition: none !important;
              transition-duration: 0s !important;
              animation: none !important;
              animation-duration: 0s !important;
              caret-color: transparent !important; /* Esconde cursor piscante */
            }
          `
        });
        await sleep(200);

        const imgName = `${screenInfo.name}-${vp.name}.png`;
        const baselinePath = path.join(BASELINES_DIR, imgName);
        const currentPath = path.join(CURRENT_DIR, imgName);
        const diffPath = path.join(DIFFS_DIR, imgName);

        // Se o arquivo de baseline não existir, grava como referência inicial (Modo Geração)
        if (!fs.existsSync(baselinePath)) {
          await page.screenshot({ path: baselinePath });
          console.log(`     💾 Baseline gerado e armazenado com sucesso.`);
        } else {
          // Caso contrário, grava a captura atual e compara pixel-a-pixel
          await page.screenshot({ path: currentPath });
          
          const result = compareImages(baselinePath, currentPath, diffPath);
          console.log(`     🔍 Comparação concluída. Pixels diferentes: ${result.mismatchCount} (${result.mismatchPercentage.toFixed(3)}% mismatch)`);

          // Limite restrito de tolerância (0.8% de tolerância para anti-aliasing e GPU subpixels)
          if (result.mismatchPercentage > 0.8) {
            console.log(`     ❌ REGRESSÃO DETECTADA! Diferença excede o limite de tolerância (0.8%).`);
            console.log(`     🖼️  Imagem de diferença salva em: e2e/screenshots/diffs/${imgName}`);
            failed = true;
          } else {
            console.log(`     ✅ Aprovado (Diferença abaixo do limite de tolerância).`);
          }
        }
      }
    }

    console.log('\n==================================================');
    if (failed) {
      console.log('❌ FALHA: REGRESSÃO VISUAL DETECTADA EM ALGUMAS TELAS!');
      console.log('==================================================');
      process.exit(1);
    } else {
      console.log('🎉 SUCESSO: TESTE DE REGRESSÃO VISUAL CONCLUÍDO - 100% OK!');
      console.log('==================================================');
    }

  } catch (error) {
    console.error('\n❌ Erro durante o teste de regressão visual:', error.message);
    console.log('==================================================');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
