const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('📝 GERANDO CONTRATO PACT-LIKE: WEB-ADMIN (CONSUMER)');
console.log('==================================================');

const contract = {
  consumer: 'web-admin',
  provider: 'api',
  version: '1.0.0',
  interactions: [
    {
      name: 'Login de Administrador',
      request: {
        method: 'POST',
        path: '/api/auth/admin/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'admin@fitmax.com',
          password: 'Admin@123'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['accessToken', 'expiresIn', 'tokenType'],
          properties: {
            accessToken: { type: 'string' },
            expiresIn: { type: 'number' },
            tokenType: { type: 'string', enum: ['Bearer'] }
          }
        }
      }
    },
    {
      name: 'Listagem Geral de Usuários',
      request: {
        method: 'GET',
        path: '/api/admin/usuarios',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'nome', 'email', 'cpf', 'avatarUrl', 'status', 'plano', 'tipo', 'createdAt'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  nome: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  cpf: { type: 'string', nullable: true },
                  avatarUrl: { type: 'string', nullable: true },
                  status: { type: 'string', enum: ['ATIVO', 'INATIVO', 'BANIDO'] },
                  plano: { type: 'string', nullable: true },
                  tipo: { type: 'string', enum: ['cliente', 'profissional'] },
                  especialidade: { type: 'string', nullable: true },
                  registroProfissional: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'iso-date' }
                }
              }
            },
            meta: {
              type: 'object',
              required: ['total', 'page', 'limit', 'totalPages'],
              properties: {
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    },
    {
      name: 'Resumo Estatístico de Moderação',
      request: {
        method: 'GET',
        path: '/api/admin/usuarios/resumo',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['total', 'ativos', 'inativos', 'banidos', 'profissionaisPro'],
          properties: {
            total: { type: 'number' },
            ativos: { type: 'number' },
            inativos: { type: 'number' },
            banidos: { type: 'number' },
            profissionaisPro: { type: 'number' }
          }
        }
      }
    },
    {
      name: 'Alteração de Status de Usuário (Toggle)',
      request: {
        method: 'PATCH',
        path: '/api/admin/usuarios/{USER_ID}/status',
        headers: {
          'Authorization': 'Bearer {TOKEN}',
          'Content-Type': 'application/json'
        },
        body: {
          tipo: 'cliente',
          novoStatus: 'INATIVO'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['id', 'status'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['ATIVO', 'INATIVO'] }
          }
        }
      }
    },
    {
      name: 'Banimento de Usuário',
      request: {
        method: 'POST',
        path: '/api/admin/usuarios/{USER_ID}/banir',
        headers: {
          'Authorization': 'Bearer {TOKEN}',
          'Content-Type': 'application/json'
        },
        body: {
          tipo: 'cliente',
          motivo: 'Teste de quebra de regras do FitMax'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['id', 'status', 'banidoEm'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['BANIDO'] },
            banidoEm: { type: 'string', format: 'iso-date' }
          }
        }
      }
    }
  ]
};

const pactsDir = path.resolve(__dirname, '../../../pacts');
if (!fs.existsSync(pactsDir)) {
  fs.mkdirSync(pactsDir, { recursive: true });
}

const contractPath = path.join(pactsDir, 'web-admin-contract.json');
fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf-8');

console.log(`✅ Contrato gerado com sucesso!`);
console.log(`📂 Caminho: pacts/web-admin-contract.json`);
console.log('==================================================\n');
