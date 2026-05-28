const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('response', response => {
    if (response.url().includes('/api/auth/admin')) {
      console.log('BROWSER NETWORK:', response.request().method(), response.url(), response.status());
    }
  });

  console.log('Navegando para o login...');
  await page.goto('http://localhost:3002/');
  
  // Fill login
  await page.type('input[type="email"]', 'admin@fitmax.com');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="button"]'); // O botão de login

  console.log('Aguardando redirecionamento para o painel...');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('URL atual:', page.url());

  console.log('Pressionando F5 (reload)...');
  await page.reload({ waitUntil: 'networkidle0' });
  console.log('URL após F5:', page.url());

  await browser.close();
})();
