// apps/api/src/modules/client-portal/dashboard/__tests__/mutation.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🧬 INICIANDO MUTAÇÃO DO BACKEND DO PACIENTE (CLIENT)');
console.log('==================================================');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const serviceFilePath = path.resolve(__dirname, '../dashboard.service.ts');
const originalContent = fs.readFileSync(serviceFilePath, 'utf-8');

const mutants = [
  {
    id: 'Mutante 1',
    description: 'Filtro de Publicações Ativas Inversão (status: \'ATIVA\' ➜ \'INATIVA\')',
    target: "where: { status: 'ATIVA' },",
    replacement: "where: { status: 'INATIVA' },"
  },
  {
    id: 'Mutante 2',
    description: 'Filtro de Consultas Pendentes Alteração (status: \'PENDENTE\' ➜ \'PAGO\')',
    target: "status: 'PENDENTE',",
    replacement: "status: 'PAGO',"
  },
  {
    id: 'Mutante 3',
    description: 'Quantidade Limite do Feed Alterado (take: 4 ➜ take: 10)',
    target: "take: 4,",
    replacement: "take: 10,"
  },
  {
    id: 'Mutante 4',
    description: 'Quantidade Limite de Consultas Pendentes Alterado (take: 3 ➜ take: 0)',
    target: "take: 3,",
    replacement: "take: 0,"
  }
];

async function run() {
  const report = [];
  let mutantsSurvived = 0;

  for (const m of mutants) {
    console.log(`\n🧬 [${m.id}] ${BOLD}${m.description}${RESET}...`);

    if (!originalContent.includes(m.target)) {
      console.error(`${RED}   ❌ ERRO: Target não localizado no arquivo dashboard.service.ts: "${m.target}"${RESET}`);
      process.exit(1);
    }

    // Injetar mutante
    const mutatedContent = originalContent.replace(m.target, m.replacement);
    fs.writeFileSync(serviceFilePath, mutatedContent, 'utf-8');
    console.log('   🔧 Mutante injetado no backend do paciente.');

    // Executar testes de unidade do service
    console.log('   🧪 Rodando Vitest contra a suíte apps/api/src/modules/client-portal/dashboard/__tests__/dashboard.service.test.ts...');
    const start = Date.now();
    let vitestPassed = false;

    try {
      execSync('npx vitest run apps/api/src/modules/client-portal/dashboard/__tests__/dashboard.service.test.ts', {
        stdio: 'ignore',
        cwd: path.resolve(__dirname, '../../../../../../') // Root do workspace
      });
      vitestPassed = true; // Os testes passaram mesmo com o código quebrado
    } catch (err) {
      vitestPassed = false; // Os testes falharam (mutante matado!)
    }

    const duration = Date.now() - start;

    if (vitestPassed) {
      console.log(`   ${RED}⚠️  MUTANTE SOBREVIVEU! Os testes do backend do paciente NÃO pegaram esta quebra de lógica em ${duration}ms.${RESET}`);
      mutantsSurvived++;
      report.push({ id: m.id, name: m.description, status: 'SOBREVIVEU', color: RED });
    } else {
      console.log(`   ${GREEN}🎯 MUTANTE MATADO! Os testes do backend detectaram a falha com sucesso em ${duration}ms.${RESET}`);
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
  console.log('📊 RELATÓRIO CONSOLIDADO DE MUTAÇÕES (CLIENT BACKEND)');
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
    console.error(`${RED}${BOLD}❌ FALHA: Cobertura de teste insatisfatória! ${mutantsSurvived} mutantes sobreviveram no backend do paciente.${RESET}`);
    console.log('==================================================\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 SUCESSO ABSOLUTO! Cobertura de testes em 100% (Mutation Score perfeito no backend do paciente).${RESET}`);
    console.log('==================================================\n');
    process.exit(0);
  }
}

run();
