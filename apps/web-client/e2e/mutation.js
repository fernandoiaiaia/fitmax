// apps/web-client/e2e/mutation.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🧬 INICIANDO MUTAÇÃO DO FRONTEND DO PACIENTE (CLIENT)');
console.log('==================================================');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const serviceFilePath = path.resolve(__dirname, '../lib/api.ts');
const originalContent = fs.readFileSync(serviceFilePath, 'utf-8');

const mutants = [
  {
    id: 'Mutante 1',
    description: 'Quebra de Segurança de Cookies (withCredentials: true ➜ false) [OWASP A05]',
    target: '  withCredentials: true,',
    replacement: '  withCredentials: false,'
  },
  {
    id: 'Mutante 2',
    description: 'Desvio de Base de API (baseURL: \'/api\' ➜ \'/api-invalid\')',
    target: "  baseURL: '/api',",
    replacement: "  baseURL: '/api-invalid',"
  },
  {
    id: 'Mutante 3',
    description: 'Falha de Armazenamento: Anula limpeza do tokenStore.clear [OWASP A04]',
    target: "  clear: () => { _accessToken = null; },",
    replacement: "  clear: () => { /* _accessToken = null; */ },"
  },
  {
    id: 'Mutante 4',
    description: 'Falha de Autenticação: Anula gravação no tokenStore.set',
    target: "  set: (token: string) => { _accessToken = token; },",
    replacement: "  set: (token: string) => { /* _accessToken = token; */ },"
  }
];

async function run() {
  const report = [];
  let mutantsSurvived = 0;

  for (const m of mutants) {
    console.log(`\n🧬 [${m.id}] ${BOLD}${m.description}${RESET}...`);

    if (!originalContent.includes(m.target)) {
      console.error(`${RED}   ❌ ERRO: Target não localizado no arquivo lib/api.ts: "${m.target}"${RESET}`);
      process.exit(1);
    }

    // Injetar mutante
    const mutatedContent = originalContent.replace(m.target, m.replacement);
    fs.writeFileSync(serviceFilePath, mutatedContent, 'utf-8');
    console.log('   🔧 Mutante injetado no client api.');

    // Executar testes de unidade do service
    console.log('   🧪 Rodando Vitest contra a suíte apps/web-client/__tests__/api.test.ts...');
    const start = Date.now();
    let vitestPassed = false;

    try {
      execSync('npx vitest run apps/web-client/__tests__/api.test.ts', {
        stdio: 'ignore',
        cwd: path.resolve(__dirname, '../../../') // Root do workspace
      });
      vitestPassed = true; // Os testes passaram mesmo com o código quebrado
    } catch (err) {
      vitestPassed = false; // Os testes falharam (mutante matado!)
    }

    const duration = Date.now() - start;

    if (vitestPassed) {
      console.log(`   ${RED}⚠️  MUTANTE SOBREVIVEU! Os testes de unidade do web-client NÃO pegaram esta quebra de lógica em ${duration}ms.${RESET}`);
      mutantsSurvived++;
      report.push({ id: m.id, name: m.description, status: 'SOBREVIVEU', color: RED });
    } else {
      console.log(`   ${GREEN}🎯 MUTANTE MATADO! Os testes de unidade detectaram a falha com sucesso em ${duration}ms.${RESET}`);
      report.push({ id: m.id, name: m.description, status: 'MATADO', color: GREEN });
    }

    // Restaurar original
    fs.writeFileSync(serviceFilePath, originalContent, 'utf-8');
  }

  // Garantir restauração final
  fs.writeFileSync(serviceFilePath, originalContent, 'utf-8');

  // Balanço Consolidado
  const totalMutants = mutants.length;
  const killedMutants = totalMutants - mutantsSurvived;
  const mutationScore = (killedMutants / totalMutants) * 100;

  console.log('\n==================================================');
  console.log('📊 RELATÓRIO CONSOLIDADO DE MUTAÇÕES (CLIENT FRONTEND)');
  console.log('==================================================');
  report.forEach(item => {
    console.log(`${item.color}[${item.status}] ${item.id}: ${item.name}${RESET}`);
  });
  console.log('==================================================');
  console.log(`📈 Cobertura de Testes Real (Mutation Score): ${BOLD}${mutationScore}%${RESET}`);
  console.log(`   - Mutantes Totais: ${totalMutants}`);
  console.log(`   - Mutantes Matados: ${killedMutants}`);
  console.log(`   - Mutantes Sobreviventes: ${mutantsSurvived}`);
  console.log('==================================================\n');

  if (mutantsSurvived > 0) {
    console.error(`${RED}${BOLD}❌ FALHA: Cobertura de teste insatisfatória! ${mutantsSurvived} mutantes sobreviveram no web-client.${RESET}`);
    console.log('==================================================\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 SUCESSO ABSOLUTO! Cobertura de testes em 100% (Mutation Score perfeito no web-client).${RESET}`);
    console.log('==================================================\n');
    process.exit(0);
  }
}

run();
