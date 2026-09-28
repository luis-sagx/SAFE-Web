import http from 'k6/http'
import exec from 'k6/execution'
import { check, sleep } from 'k6'

// Recorrido real de una persona en una sesión presencial, no un bucle sobre un
// endpoint: entra una vez, abre una sección, "juega" un escenario (pausa de
// 20–60 s), registra la corrida y a veces revisa su recorrido. Cada VU usa su
// propia cuenta, así los límites por participante se comportan como en el aula.
//
// Cuentas: tests/carga/seed_accounts.py crea carga0000@ejemplo.ec… en el
// entorno de prueba. Nunca contra producción.
//
//   k6 run -e BASE_URL=https://pruebas.example -e PROFILE=spike tests/carga/aula.js
//
// Perfiles (PROFILE):
//   smoke   1 VU, 1 min: ¿funciona?
//   spike   40 VUs entran en 10 s y juegan 3 min: el inicio de una clase
//   carga   sube a 50 VUs y sostiene 10 min: un aula y media en uso normal
//   estres  +10 VUs cada 2 min hasta MAX_VUS: dónde se rompe
//   soak    30 VUs durante 1 h: fugas de memoria
//
// Todas las peticiones salen de la IP de k6, igual que un aula tras el NAT de
// la universidad: si los límites por IP estuvieran mal, esta prueba lo
// muestra como 429.

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080'
const profile = __ENV.PROFILE || 'smoke'
const accounts = Number(__ENV.ACCOUNTS || 100)
const password = __ENV.LOAD_PASSWORD || 'Clave-Larga-123!'
const thinkMin = Number(__ENV.THINK_MIN || 20)
const thinkMax = Number(__ENV.THINK_MAX || 60)
const maxVus = Number(__ENV.MAX_VUS || 200)

// La narración no se incluye: llama a Cartesia, que cobra por uso y no es
// parte de la capacidad del servidor.
const SCENARIOS = [
  'phishing/loteria-premiada',
  'phishing/factura-sri',
  'phishing/clave-caducada',
  'phishing/rol-de-pagos',
]
const OUTCOMES = ['CORRECTO', 'PARCIAL', 'INCORRECTO']

function stressStages() {
  const stages = []
  for (let vus = 10; vus <= maxVus; vus += 10) {
    stages.push({ duration: '30s', target: vus }, { duration: '90s', target: vus })
  }
  return stages
}

const PROFILES = {
  smoke: { executor: 'constant-vus', vus: 1, duration: '1m' },
  spike: {
    executor: 'ramping-vus',
    stages: [
      { duration: '10s', target: 40 },
      { duration: '3m', target: 40 },
      { duration: '10s', target: 0 },
    ],
  },
  carga: {
    executor: 'ramping-vus',
    stages: [
      { duration: '2m', target: 50 },
      { duration: '10m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  estres: { executor: 'ramping-vus', stages: stressStages() },
  soak: { executor: 'constant-vus', vus: 30, duration: '1h' },
}

if (!PROFILES[profile]) throw new Error(`PROFILE desconocido: ${profile}`)

export const options = {
  scenarios: { [profile]: PROFILES[profile] },
  // El estrés busca el punto de quiebre: que cruce los umbrales es el
  // resultado, no un fallo del script. Los demás perfiles sí deben cumplirlos.
  thresholds:
    profile === 'estres'
      ? {}
      : {
          http_req_failed: ['rate<0.01'],
          http_req_duration: ['p(95)<750'],
          'http_req_duration{name:login}': ['p(95)<1500'],
          checks: ['rate>0.99'],
        },
}

const json = { 'Content-Type': 'application/json' }

// Estado por VU: cada VU es una persona con su cuenta y su sesión.
let token = null

function email() {
  const index = (exec.vu.idInTest - 1) % accounts
  return `carga${String(index).padStart(4, '0')}@ejemplo.ec`
}

function login() {
  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email: email(), password }),
    { headers: json, tags: { name: 'login' } },
  )
  check(response, { 'login 200': (r) => r.status === 200 })
  token = response.status === 200 ? response.json('accessToken') : null
}

// El access token vive 15 min; en perfiles largos vence a mitad de la prueba.
// La SPA lo renueva con la cookie de refresh; aquí basta con volver a entrar.
function authed(method, path, body, name) {
  if (!token) login()
  const params = {
    headers: { ...json, Authorization: `Bearer ${token}` },
    tags: { name },
  }
  let response = http.request(method, `${baseUrl}${path}`, body, params)
  if (response.status === 401) {
    login()
    params.headers.Authorization = `Bearer ${token}`
    response = http.request(method, `${baseUrl}${path}`, body, params)
  }
  return response
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default function () {
  if (!token) {
    login()
    if (!token) {
      sleep(5)
      return
    }
  }

  const progress = authed('GET', '/api/runs/progreso/phishing', null, 'progreso')
  check(progress, { 'progreso 200': (r) => r.status === 200 })

  const startedAt = new Date().toISOString()
  const playing = thinkMin + Math.random() * (thinkMax - thinkMin)
  sleep(playing)

  const run = authed(
    'POST',
    '/api/runs',
    JSON.stringify({
      scenarioId: pick(SCENARIOS),
      version: 1,
      outcome: pick(OUTCOMES),
      score: 50,
      endingId: 'e_carga',
      durationMs: Math.round(playing * 1000),
      startedAt,
      decisions: [],
    }),
    'corrida',
  )
  check(run, { 'corrida 201': (r) => r.status === 201 })

  if (Math.random() < 0.2) {
    const mine = authed('GET', '/api/runs/me', null, 'recorrido')
    check(mine, { 'recorrido 200': (r) => r.status === 200 })
  }

  // Leer el debrief antes del siguiente escenario.
  sleep(5 + Math.random() * 10)
}
