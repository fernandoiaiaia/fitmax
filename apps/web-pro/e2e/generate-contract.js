const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('📝 GERANDO CONTRATO PACT-LIKE: WEB-PRO (CONSUMER)');
console.log('==================================================');

const contract = {
  consumer: 'web-pro',
  provider: 'api',
  version: '1.0.0',
  interactions: [
    {
      name: 'Login de Profissional',
      request: {
        method: 'POST',
        path: '/api/auth/pro/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'rafael.costa@fitmax.com',
          password: 'Pro@123456'
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
      name: 'Perfil do Profissional Logado',
      request: {
        method: 'GET',
        path: '/api/pro/me',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['id', 'name', 'especialidade', 'email', 'registroProfissional', 'avatarUrl', '_count'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            especialidade: { type: 'string' },
            email: { type: 'string', format: 'email' },
            plano: { type: 'string', nullable: true },
            registroProfissional: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            cidade: { type: 'string', nullable: true },
            uf: { type: 'string', nullable: true },
            telefone: { type: 'string', nullable: true },
            username: { type: 'string', nullable: true },
            convenios: { type: 'array', items: { type: 'string' } },
            notificacoes: { type: 'object', nullable: true },
            _count: {
              type: 'object',
              required: ['consultas'],
              properties: {
                consultas: { type: 'number' }
              }
            }
          }
        }
      }
    },
    {
      name: 'Sumário do Dashboard do Profissional',
      request: {
        method: 'GET',
        path: '/api/pro/dashboard/summary',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['consultas', 'feedDestaques', 'slotsDisponiveisHoje'],
          properties: {
            consultas: {
              type: 'object',
              required: ['total', 'agendada', 'concluida'],
              properties: {
                total: { type: 'number' },
                agendada: { type: 'number' },
                concluida: { type: 'number' }
              }
            },
            feedDestaques: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'topico', 'imagemUrl', 'aspectRatio', 'likes', 'criadoEm', 'profissional'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  topico: { type: 'string' },
                  imagemUrl: { type: 'string' },
                  aspectRatio: { type: 'number' },
                  likes: { type: 'number' },
                  criadoEm: { type: 'string', format: 'iso-date' },
                  profissional: {
                    type: 'object',
                    required: ['id', 'nome'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      nome: { type: 'string' },
                      avatarUrl: { type: 'string', nullable: true }
                    }
                  }
                }
              }
            },
            slotsDisponiveisHoje: { type: 'number' }
          }
        }
      }
    },
    {
      name: 'Listagem de Consultas do Profissional',
      request: {
        method: 'GET',
        path: '/api/pro/consultas',
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
                required: ['id', 'status', 'data', 'paciente'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  status: { type: 'string', enum: ['agendada', 'em_andamento', 'concluida', 'cancelada'] },
                  data: { type: 'string', format: 'iso-date' },
                  paciente: {
                    type: 'object',
                    required: ['id', 'nome', 'avatarUrl'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      nome: { type: 'string' },
                      avatarUrl: { type: 'string', nullable: true }
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
      name: 'Resumo Financeiro do Período',
      request: {
        method: 'GET',
        path: '/api/pro/consultas/resumo-periodo',
        headers: {
          'Authorization': 'Bearer {TOKEN}'
        }
      },
      response: {
        status: 200,
        schema: {
          type: 'object',
          required: ['agendamentos', 'valorGeradoReais'],
          properties: {
            agendamentos: { type: 'number' },
            valorGeradoReais: { type: 'string' }
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

const contractPath = path.join(pactsDir, 'web-pro-contract.json');
fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf-8');

console.log(`✅ Contrato do Profissional gerado com sucesso!`);
console.log(`📂 Caminho: pacts/web-pro-contract.json`);
console.log('==================================================\n');
