const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('📝 GERANDO CONTRATO PACT-LIKE: WEB-CLIENT (CONSUMER)');
console.log('==================================================');

const contract = {
  consumer: 'web-client',
  provider: 'api',
  version: '1.0.0',
  interactions: [
    {
      name: 'Login de Paciente',
      request: {
        method: 'POST',
        path: '/api/auth/client/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'carlos.mendes@email.com',
          password: 'Client@123'
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
      name: 'Listagem de Consultas do Paciente',
      request: {
        method: 'GET',
        path: '/api/client-portal/consultas',
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
                required: ['id', 'statusFluxo', 'dataHora', 'especialidade', 'tipo', 'valorReais', 'profissional'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  statusFluxo: { type: 'string', enum: ['pagamento_pendente', 'consulta_confirmada', 'consulta_cancelada', 'consulta_concluida', 'consulta_ausente'] },
                  dataHora: { type: 'string', format: 'iso-date' },
                  especialidade: { type: 'string' },
                  tipo: { type: 'string', enum: ['ONLINE', 'PRESENCIAL'] },
                  valorReais: { type: 'string' },
                  profissional: {
                    type: 'object',
                    required: ['id', 'name', 'avatarUrl', 'especialidade'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      avatarUrl: { type: 'string', nullable: true },
                      especialidade: { type: 'string', nullable: true },
                      cidade: { type: 'string', nullable: true },
                      uf: { type: 'string', nullable: true }
                    }
                  }
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
      name: 'Estatísticas de Consultas do Paciente',
      request: {
        method: 'GET',
        path: '/api/client-portal/consultas/stats',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['totalConsultas', 'totalInvestidoReais', 'consultasHoje', 'confirmadas', 'pendentes'],
          properties: {
            totalConsultas: { type: 'number' },
            totalInvestidoReais: { type: 'string' },
            consultasHoje: { type: 'number' },
            confirmadas: { type: 'number' },
            pendentes: { type: 'number' },
            proximaEm: { type: 'string', nullable: true }
          }
        }
      }
    },
    {
      name: 'Listar Profissionais Disponíveis',
      request: {
        method: 'GET',
        path: '/api/client-portal/profissionais',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name', 'avatarUrl', 'especialidade'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  avatarUrl: { type: 'string', nullable: true },
                  especialidade: { type: 'string', nullable: true },
                  cidade: { type: 'string', nullable: true },
                  uf: { type: 'string', nullable: true },
                  registroProfissional: { type: 'string', nullable: true }
                }
              }
            }
          }
        }
      }
    },
    {
      name: 'Listar Especialidades do Paciente',
      request: {
        method: 'GET',
        path: '/api/client-portal/especialidades',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    },
    {
      name: 'Listar Convênios Aceitos',
      request: {
        method: 'GET',
        path: '/api/client-portal/convenios',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'nome', 'categoria', 'ativo'],
            properties: {
              id: { type: ['string', 'number'] },
              nome: { type: 'string' },
              categoria: { type: 'string' },
              ativo: { type: 'boolean' }
            }
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

const contractPath = path.join(pactsDir, 'web-client-contract.json');
fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf-8');

console.log(`✅ Contrato do Paciente (web-client) gerado com sucesso!`);
console.log(`📂 Caminho: pacts/web-client-contract.json`);
console.log('==================================================\n');
