import { env } from './config/env';

const BASE_URL = `http://localhost:${env.PORT || 3001}`;
const ADMIN_EMAIL = 'admin@fitmax.com';
const ADMIN_PASSWORD = 'Admin@123';

interface TestMetrics {
  totalRequests: number;
  successCount: number;
  rateLimitCount: number;
  otherErrorCount: number;
  latencies: number[];
  startTime: number;
  endTime: number;
  statusCodes: Record<number, number>;
}

// Helper to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function authenticate(): Promise<string> {
  console.log(`🔐 Autenticando em ${BASE_URL}/api/auth/admin/login...`);
  
  const response = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha na autenticação (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { accessToken: string };
  if (!data.accessToken) {
    throw new Error('Access token não retornado no corpo da resposta.');
  }

  console.log('✅ Autenticado com sucesso! JWT obtido.');
  return data.accessToken;
}

async function runLoadTest(
  accessToken: string,
  totalRequests: number,
  concurrencyLimit: number
): Promise<TestMetrics> {
  const metrics: TestMetrics = {
    totalRequests,
    successCount: 0,
    rateLimitCount: 0,
    otherErrorCount: 0,
    latencies: [],
    startTime: performance.now(),
    endTime: 0,
    statusCodes: {},
  };

  console.log(`\n🚀 Iniciando teste de carga com total de ${totalRequests} requisições.`);
  console.log(`👥 Concorrência: ${concurrencyLimit} conexões simultâneas.`);
  console.log(`🛡️  Modo do Rate Limiter: ${env.NODE_ENV === 'test' ? 'DESATIVADO (NODE_ENV=test)' : 'ATIVO (NODE_ENV=development)'}\n`);

  let requestsRemaining = totalRequests;
  let activeWorkers = 0;
  let requestsCompleted = 0;

  // Single worker task
  async function worker() {
    activeWorkers++;
    while (true) {
      // Check if we need to launch another request
      if (requestsRemaining <= 0) {
        break;
      }
      requestsRemaining--;

      const start = performance.now();
      try {
        const response = await fetch(`${BASE_URL}/api/admin/usuarios?limit=50`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const duration = performance.now() - start;
        metrics.latencies.push(duration);

        const status = response.status;
        metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;

        if (response.ok) {
          metrics.successCount++;
        } else if (status === 429) {
          metrics.rateLimitCount++;
        } else {
          metrics.otherErrorCount++;
        }
      } catch (error) {
        const duration = performance.now() - start;
        metrics.latencies.push(duration);
        metrics.otherErrorCount++;
        metrics.statusCodes[500] = (metrics.statusCodes[500] || 0) + 1;
      }

      requestsCompleted++;
      // Progress log
      if (requestsCompleted % 50 === 0 || requestsCompleted === totalRequests) {
        const progress = ((requestsCompleted / totalRequests) * 100).toFixed(0);
        console.log(`   [Progresso] ${requestsCompleted}/${totalRequests} requisições finalizadas (${progress}%)`);
      }
    }
    activeWorkers--;
  }

  // Spawn workers up to the concurrency limit
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrencyLimit; i++) {
    workers.push(worker());
  }

  // Wait for all workers to finish
  await Promise.all(workers);

  metrics.endTime = performance.now();
  return metrics;
}

function reportMetrics(metrics: TestMetrics) {
  const totalDurationMs = metrics.endTime - metrics.startTime;
  const totalDurationSec = totalDurationMs / 1000;
  const rps = metrics.totalRequests / totalDurationSec;

  const latencies = metrics.latencies.sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / (latencies.length || 1);

  // Percentiles
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`\n==================================================`);
  console.log(`📊 SUMÁRIO DE ESTRESSE DO BACK-END`);
  console.log(`==================================================`);
  console.log(`⏱️  Tempo total de execução:  ${totalDurationSec.toFixed(2)} segundos`);
  console.log(`⚡ Throughput (RPS):         ${rps.toFixed(2)} reqs/seg`);
  console.log(`🎯 Sucesso (200 OK):         ${metrics.successCount} (${((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`🛡️  Bloqueado (429 RateLimit): ${metrics.rateLimitCount} (${((metrics.rateLimitCount / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`❌ Falhas/Outros Erros:      ${metrics.otherErrorCount} (${((metrics.otherErrorCount / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`\n📶 Latências de Resposta:`);
  console.log(`   - Mínima:                  ${minLatency.toFixed(2)} ms`);
  console.log(`   - Média:                   ${avgLatency.toFixed(2)} ms`);
  console.log(`   - Máxima:                  ${maxLatency.toFixed(2)} ms`);
  console.log(`   - Percentil 50 (Mediana):  ${p50.toFixed(2)} ms`);
  console.log(`   - Percentil 95:            ${p95.toFixed(2)} ms`);
  console.log(`   - Percentil 99:            ${p99.toFixed(2)} ms`);
  
  console.log(`\n📋 Contagem de Status HTTP:`);
  Object.entries(metrics.statusCodes).forEach(([code, count]) => {
    let name = 'UNKNOWN';
    if (code === '200') name = 'OK';
    if (code === '401') name = 'UNAUTHORIZED';
    if (code === '429') name = 'TOO MANY REQUESTS (RATE LIMIT)';
    if (code === '500') name = 'INTERNAL SERVER ERROR';
    console.log(`   - [HTTP ${code}] ${name}: ${count}`);
  });
  console.log(`==================================================\n`);
}

async function main() {
  try {
    const token = await authenticate();
    
    // Configuração dos lotes
    // Se o rate limit estiver ativo (development), enviamos 150 requisições
    // Se estiver desativado (test), enviamos 400 requisições para estressar banco
    const isTestMode = env.NODE_ENV === 'test';
    const totalRequests = isTestMode ? 400 : 150;
    const concurrency = 20;

    const metrics = await runLoadTest(token, totalRequests, concurrency);
    reportMetrics(metrics);
  } catch (error) {
    console.error('❌ Ocorreu um erro no teste de estresse:', error);
    process.exit(1);
  }
}

main();
