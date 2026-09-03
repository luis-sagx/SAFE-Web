import http from 'k6/http'
import { check, sleep } from 'k6'

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080'
const duration = __ENV.LOAD_TEST_DURATION || '30s'

export const options = {
  discardResponseBodies: true,
  scenarios: {
    nominal: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: 2,
      maxVUs: 5,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750'],
    checks: ['rate>0.99'],
  },
}

export function setup() {
  const suffix = Date.now()
  const response = http.post(
    `${baseUrl}/api/auth/register`,
    JSON.stringify({
      nombre: 'Carga',
      apellido: 'CI',
      email: `carga-${suffix}@ejemplo.com`,
      // Distinta de la usada por el smoke previo del pipeline, pero igual de
      // válida: la cédula se indexa de forma única incluso como HMAC.
      cedula: '1710034073',
      password: 'clave-larga-123',
    }),
    { headers: { 'Content-Type': 'application/json' }, responseType: 'text' },
  )

  check(response, { 'registro de carga responde 201': (r) => r.status === 201 })
  const body = response.json()
  return { accessToken: body.accessToken }
}

export default function ({ accessToken }) {
  const health = http.get(`${baseUrl}/api/health`)
  check(health, { 'health responde 200': (r) => r.status === 200 })

  const run = http.post(
    `${baseUrl}/api/runs`,
    JSON.stringify({
      scenarioId: 'phishing/factura-sri',
      version: 1,
      outcome: 'CORRECTO',
      score: 100,
      endingId: 'e_verifica',
      durationMs: 1000,
      startedAt: new Date().toISOString(),
      decisions: [],
    }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  check(run, { 'corrida responde 201': (r) => r.status === 201 })
  sleep(0.1)
}
