// apps/web-admin/e2e/mutation.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🧬 INICIANDO AUDITORIA DE TESTES DE MUTAÇÃO (MUTATION TESTING)');
console.log('==================================================');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const proxyFilePath = path.resolve(__dirname, '../proxy.ts');
const originalContent = fs.readFileSync(proxyFilePath, 'utf-8');

const mutants = [
  {
    id: 'Mutante 1',
    description: 'Alteração de Operador Lógico (&& ➜ || na proteção de rota)',
    target: 'pathname.startsWith("/painel") && !hasRefreshCookie',
    replacement: 'pathname.startsWith("/painel") || !hasRefreshCookie'
  },
  {
    id: 'Mutante 2',
    description: 'Remoção de Negação Lógica (!hasRefreshCookie ➜ hasRefreshCookie)',
    target: 'pathname.startsWith("/painel") && !hasRefreshCookie',
    replacement: 'pathname.startsWith("/painel") && hasRefreshCookie'
  },
  {
    id: 'Mutante 3',
    description: 'Inversão da Condição de Login (=== ➜ !==)',
    target: 'pathname === "/" && hasRefreshCookie',
    replacement: 'pathname !== "/" && hasRefreshCookie'
  },
  {
    id: 'Mutante 4',
    description: 'Desvio de Redirecionamento da Login ("/painel" ➜ "/")',
    target: 'return NextResponse.redirect(new URL("/painel", req.url));',
    replacement: 'return NextResponse.redirect(new URL("/", req.url));'
  }
];

async function run() {
  const report = [];
  let mutantsSurvived = 0;

  for (const m of mutants) {
    console.log(`\n🧬 [${m.id}] ${BOLD}${m.description}${RESET}...`);

    if (!originalContent.includes(m.target)) {
      console.error(`${RED}   ❌ ERRO: Target não localizado no arquivo original proxy.ts: "${m.target}"${RESET}`);
      process.exit(1);
    }

    // Injetar mutante
    const mutatedContent = originalContent.replace(m.target, m.replacement);
    fs.writeFileSync(proxyFilePath, mutatedContent, 'utf-8');
    console.log('   🔧 Mutante injetado no código de produção.');

    // Executar testes de unidade do proxy
    console.log('   🧪 Rodando Vitest contra a suíte __tests__/proxy.test.ts...');
    const start = Date.now();
    let vitestPassed = false;

    try {
      execSync('npx vitest run __tests__/proxy.test.ts', {
        stdio: 'ignore',
        cwd: path.resolve(__dirname, '..')
      });
      vitestPassed = true; // Os testes passaram mesmo com o código quebrado
    } catch (err) {
      vitestPassed = false; // Os testes falharam (mutante matado!)
    }

    const duration = Date.now() - start;

    if (vitestPassed) {
      console.log(`   ${RED}⚠️  MUTANTE SOBREVIVEU! Os testes de unidade NÃO pegaram esta quebra de lógica em ${duration}ms.${RESET}`);
      mutantsSurvived++;
      report.push({ id: m.id, name: m.description, status: 'SOBREVIVEU', color: RED });
    } else {
      console.log(`   ${GREEN}🎯 MUTANTE MATADO! Os testes de unidade detectaram a falha com sucesso em ${duration}ms.${RESET}`);
      report.push({ id: m.id, name: m.description, status: 'MATADO', color: GREEN });
    }

    // Restaurar original
    fs.writeFileSync(proxyFilePath, originalContent, 'utf-8');
  }

  // Garantir restauração de segurança final
  fs.writeFileSync(proxyFilePath, originalContent, 'utf-8');

  // Balanço Consolidado
  const totalMutants = mutants.length;
  const killedMutants = totalMutants - mutantsSurvived;
  const mutationScore = (killedMutants / totalMutants) * 100;

  console.log('\n==================================================');
  console.log('📊 RELATÓRIO CONSOLIDADO DE ENGENHARIA DE MUTAÇÕES');
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
    console.error(`${RED}${BOLD}❌ FALHA: Cobertura de teste insatisfatória! ${mutantsSurvived} mutantes sobreviveram.${RESET}`);
    console.log('⚠️  Adicione mais asserções ou casos de teste em __tests__/proxy.test.ts para matar as brechas acima.');
    console.log('==================================================\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 SUCESSO ABSOLUTO! Cobertura de testes em 100% (Mutation Score perfeito).${RESET}`);
    console.log('🛡️  A suíte de testes de unidade do Middleware está totalmente blindada!');
    console.log('==================================================\n');
    process.exit(0);
  }
}

run();
