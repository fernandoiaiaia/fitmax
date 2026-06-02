// apps/api/src/modules/usuarios/__tests__/mutation.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==================================================');
console.log('🧬 INICIANDO AUDITORIA DE TESTES DE MUTAÇÃO (BACKEND)');
console.log('==================================================');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const serviceFilePath = path.resolve(__dirname, '../usuarios.service.ts');
const originalContent = fs.readFileSync(serviceFilePath, 'utf-8');

const mutants = [
  {
    id: 'Mutante 1',
    description: 'Remoção de Máscara de CPF (mascararCpf ➜ u.cpf) [OWASP A05]',
    target: 'cpf:                  mascararCpf(u.cpf),',
    replacement: 'cpf:                  u.cpf,'
  },
  {
    id: 'Mutante 2',
    description: 'Inversão de Lógica de Toggle de Status (status === "BANIDO" ➜ !== "BANIDO")',
    target: "if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário banido não pode ser ativado/desativado por este endpoint'), { statusCode: 422 });",
    replacement: "if (u.status !== 'BANIDO') throw Object.assign(new Error('Usuário banido não pode ser ativado/desativado por este endpoint'), { statusCode: 422 });"
  },
  {
    id: 'Mutante 3',
    description: 'Inversão de Validação de Usuário já Banido (status === "BANIDO" ➜ !== "BANIDO")',
    target: "if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário já está banido'), { statusCode: 422 });",
    replacement: "if (u.status !== 'BANIDO') throw Object.assign(new Error('Usuário já está banido'), { statusCode: 422 });"
  },
  {
    id: 'Mutante 4',
    description: 'Inversão de Checagem de Restauração de Não-Banidos (status !== "BANIDO" ➜ === "BANIDO")',
    target: "if (u.status !== 'BANIDO') throw Object.assign(new Error('Usuário não está banido'), { statusCode: 422 });",
    replacement: "if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário não está banido'), { statusCode: 422 });"
  }
];

async function run() {
  const report = [];
  let mutantsSurvived = 0;

  for (const m of mutants) {
    console.log(`\n🧬 [${m.id}] ${BOLD}${m.description}${RESET}...`);

    if (!originalContent.includes(m.target)) {
      console.error(`${RED}   ❌ ERRO: Target não localizado no arquivo original usuarios.service.ts: "${m.target}"${RESET}`);
      process.exit(1);
    }

    // Injetar mutante
    const mutatedContent = originalContent.replace(m.target, m.replacement);
    fs.writeFileSync(serviceFilePath, mutatedContent, 'utf-8');
    console.log('   🔧 Mutante injetado no código de produção do backend.');

    // Executar testes de unidade do service
    console.log('   🧪 Rodando Vitest contra a suíte src/modules/usuarios/__tests__/usuarios.service.test.ts...');
    const start = Date.now();
    let vitestPassed = false;

    try {
      execSync('npx vitest run src/modules/usuarios/__tests__/usuarios.service.test.ts', {
        stdio: 'ignore',
        cwd: path.resolve(__dirname, '../../../../') // Root do workspace
      });
      vitestPassed = true; // Os testes passaram mesmo com o código quebrado
    } catch (err) {
      vitestPassed = false; // Os testes falharam (mutante matado!)
    }

    const duration = Date.now() - start;

    if (vitestPassed) {
      console.log(`   ${RED}⚠️  MUTANTE SOBREVIVEU! Os testes do backend NÃO pegaram esta quebra de lógica em ${duration}ms.${RESET}`);
      mutantsSurvived++;
      report.push({ id: m.id, name: m.description, status: 'SOBREVIVEU', color: RED });
    } else {
      console.log(`   ${GREEN}🎯 MUTANTE MATADO! Os testes do backend detectaram a falha com sucesso em ${duration}ms.${RESET}`);
      report.push({ id: m.id, name: m.description, status: 'MATADO', color: GREEN });
    }

    // Restaurar original
    fs.writeFileSync(serviceFilePath, originalContent, 'utf-8');
  }

  // Garantir restauração de segurança final
  fs.writeFileSync(serviceFilePath, originalContent, 'utf-8');

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
    console.error(`${RED}${BOLD}❌ FALHA: Cobertura de teste insatisfatória! ${mutantsSurvived} mutantes sobreviveram no backend.${RESET}`);
    console.log('⚠️  Adicione mais asserções ou testes unitários em usuarios.service.test.ts para matar as brechas acima.');
    console.log('==================================================\n');
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 SUCESSO ABSOLUTO! Cobertura de testes em 100% (Mutation Score perfeito no backend).${RESET}`);
    console.log('🛡️  A suíte de testes de moderação do backend está totalmente blindada!');
    console.log('==================================================\n');
    process.exit(0);
  }
}

run();
