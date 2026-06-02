const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('🔍 INICIANDO AUDITORIA DE CONTRATO PACT: API PROVIDER (WEB-PRO)');
console.log('==================================================');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const contractPath = path.resolve(__dirname, '../../../pacts/web-pro-contract.json');

// ─── Helpers de Validação Recursiva de Schema ─────────────────────────────────

function validarSchema(data, schema, pfx = '') {
  const errors = [];

  if (data === null) {
    if (schema.nullable) {
      return errors; // Válido se nulo for permitido
    } else {
      errors.push(`${pfx} não deve ser nulo`);
      return errors;
    }
  }

  if (data === undefined) {
    errors.push(`${pfx} é obrigatório e está ausente`);
    return errors;
  }

  // Validar tipos primitivos
  if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      errors.push(`${pfx} deve ser um array (recebeu: ${typeof data})`);
      return errors;
    }
    if (schema.items) {
      data.forEach((item, idx) => {
        errors.push(...validarSchema(item, schema.items, `${pfx}[${idx}]`));
      });
    }
  } else if (schema.type === 'object') {
    if (typeof data !== 'object' || Array.isArray(data)) {
      errors.push(`${pfx} deve ser um objeto (recebeu: ${typeof data})`);
      return errors;
    }

    // Verificar campos requeridos
    if (schema.required) {
      schema.required.forEach(field => {
        if (data[field] === undefined) {
          errors.push(`${pfx}.${field} é um campo obrigatório do contrato mas está ausente`);
        }
      });
    }

    // Validar propriedades do objeto
    if (schema.properties) {
      Object.keys(data).forEach(key => {
        if (!schema.properties[key]) {
          // Permitimos campos adicionais para compatibilidade futura (Forward compatibility)
          return;
        }
        errors.push(...validarSchema(data[key], schema.properties[key], `${pfx}.${key}`));
      });
    }
  } else {
    // Tipos primitivos: string, number, boolean
    if (typeof data !== schema.type) {
      errors.push(`${pfx} deve ser do tipo ${schema.type} (recebeu: ${typeof data})`);
      return errors;
    }

    // Validação de enums
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`${pfx} deve ser um dos valores: [${schema.enum.join(', ')}] (recebeu: "${data}")`);
    }

    // Validação de formatos especiais
    if (schema.format && typeof data === 'string') {
      if (schema.format === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data)) {
          errors.push(`${pfx} deve ser um UUID válido (recebeu: "${data}")`);
        }
      } else if (schema.format === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data)) {
          errors.push(`${pfx} deve ser um E-mail válido (recebeu: "${data}")`);
        }
      } else if (schema.format === 'iso-date') {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:\d{2})?)$/;
        if (!isoRegex.test(data)) {
          errors.push(`${pfx} deve ser uma data no formato ISO-8601 (recebeu: "${data}")`);
        }
      }
    }
  }

  return errors;
}

// ─── Execução da Auditoria ───────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(contractPath)) {
    console.error(`❌ ERRO: Arquivo de contrato não encontrado em: ${contractPath}`);
    process.exit(1);
  }

  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
  console.log(`ℹ️ Contrato carregado para o consumidor: ${contract.consumer} | Provider: ${contract.provider} (v${contract.version})`);

  let token = '';
  const report = [];
  let testsFailed = false;

  for (const interaction of contract.interactions) {
    console.log(`\n🌐 [Interação] Rodando teste de contrato para: "${interaction.name}"`);

    // Injetar token dinamicamente se a rota requerer
    const headers = { ...interaction.request.headers };
    if (headers['Authorization'] && headers['Authorization'].includes('{TOKEN}')) {
      if (!token) {
        console.error('   ❌ ERRO: Rota requer token, mas a autenticação ainda não foi executada.');
        testsFailed = true;
        continue;
      }
      headers['Authorization'] = headers['Authorization'].replace('{TOKEN}', token);
    }

    const options = {
      method: interaction.request.method,
      headers
    };

    if (interaction.request.body) {
      options.body = JSON.stringify(interaction.request.body);
    }

    try {
      const response = await fetch(`${BASE_URL}${interaction.request.path}`, options);
      
      if (response.status !== interaction.response.status) {
        console.error(`   ❌ FALHA: Status HTTP incorreto. Esperado: ${interaction.response.status}, Recebido: ${response.status}`);
        testsFailed = true;
        report.push({
          name: interaction.name,
          success: false,
          error: `Status HTTP incorreto (Esperado: ${interaction.response.status}, Recebido: ${response.status})`
        });
        continue;
      }

      const body = await response.json();

      // Guardar token se for a rota de login
      if (interaction.name === 'Login de Profissional') {
        token = body.accessToken;
      }

      // Validar contra o schema do contrato
      const schemaErrors = validarSchema(body, interaction.response.schema, 'response');

      if (schemaErrors.length > 0) {
        console.error(`   ❌ QUEBRA DE CONTRATO DETECTADA!`);
        schemaErrors.forEach(err => console.error(`      - ${err}`));
        testsFailed = true;
        report.push({
          name: interaction.name,
          success: false,
          error: `Divergência de Schema: ${schemaErrors.join('; ')}`
        });
      } else {
        console.log('   ✅ Aprovado (Schema de dados perfeitamente em conformidade).');
        report.push({ name: interaction.name, success: true });
      }

    } catch (err) {
      console.error(`   ❌ ERRO NA EXECUÇÃO HTTP: ${err.message}`);
      testsFailed = true;
      report.push({
        name: interaction.name,
        success: false,
        error: `Erro HTTP: ${err.message}`
      });
    }
  }

  console.log('\n==================================================');
  console.log('📊 RELATÓRIO CONSOLIDADO DE AUDITORIA DE CONTRATOS (WEB-PRO)');
  console.log('==================================================');
  report.forEach(item => {
    if (item.success) {
      console.log(`🟢 [PASSOU] ${item.name}`);
    } else {
      console.log(`🔴 [FALHOU] ${item.name} - ${item.error}`);
    }
  });
  console.log('==================================================');

  if (testsFailed) {
    console.error('\n❌ ERRO: ALGUMA QUEBRA DE CONTRATO FOI DETECTADA! Bloqueando deploy.');
    process.exit(1);
  } else {
    console.log('\n🎉 SUCESSO ABSOLUTO: Todos os contratos do profissional validados e sem quebras!');
    process.exit(0);
  }
}

run();
