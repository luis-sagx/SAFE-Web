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
  // Ya no se registra una cuenta nueva aquí: desde que el registro exige
  // confirmar el correo (issue #295), una cuenta recién creada no puede
  // iniciar sesión de inmediato, y k6 corre en su propio contenedor sin
  // acceso a Postgres para confirmarla a mano (a diferencia del paso previo
  // del pipeline, "Registro y corrida contra la pila real", que sí tiene
  // acceso vía `docker compose exec`). En su lugar, se reutiliza esa misma
  // cuenta — ya registrada y confirmada por ese paso anterior — con un
  // login normal, que sigue entregando sesión de inmediato sin cambios.
  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({
      email: 'ci@ejemplo.ec',
      password: 'Clave-Larga-123!',
    }),
    { headers: { 'Content-Type': 'application/json' }, responseType: 'text' },
  )

  check(response, { 'login de carga responde 200': (r) => r.status === 200 })
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
