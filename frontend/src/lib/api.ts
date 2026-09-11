// Único punto de contacto con el backend: ningún componente llama a fetch.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Access token en localStorage (vive 15 min); riesgo de XSS acotado por la CSP.
// El refresh token nunca pasa por aquí: va en cookie httpOnly que solo el
// backend lee, adjuntada solo en POST /auth/refresh (SameSite=Strict).
const TOKEN_KEY = 'mic-access-token'

export interface Participant {
  id: string
  nombre: string | null
  apellido: string | null
  email: string | null
  role: 'PARTICIPANT' | 'SUPERVISOR'
  /** Si ya vio la pantalla de bienvenida y no pidió que volviera a aparecer. */
  onboardingVisto: boolean
}

export interface Session {
  accessToken: string
  participant: Participant
}

export type RunOutcome = 'CORRECTO' | 'PARCIAL' | 'INCORRECTO'

export interface RunPayload {
  scenarioId: string
  version: number
  outcome: RunOutcome
  score: number
  endingId: string
  durationMs: number
  startedAt: string
  decisions: unknown[]
}

export interface RunSummary {
  id: string
  scenarioId: string
  version: number
  outcome: RunOutcome
  score: number
  endingId: string
  durationMs: number
  finishedAt: string
}

export interface ProgresoEscenario {
  id: string
  /** Solo aparece si el participante ya lo intentó al menos una vez. */
  ultimoOutcome?: RunOutcome
}

export interface Progreso {
  modulo: string
  escenarios: ProgresoEscenario[]
  aprobados: number
  /** Umbral que exige el servidor. El total de escenarios no viaja aquí: lo
   *  da el catálogo, que es el único lugar donde existen de verdad. */
  requeridos: number
  aprobado: boolean
  ronda?: number
  rondaEnCurso?: {
    jugados: number
    escenarios: ProgresoEscenario[]
  } | null
}

export interface Credentials {
  nombre: string
  apellido: string
  email: string
  /// Solo viaja en el registro. El backend guarda su HMAC y descarta el valor:
  /// la cédula en claro no existe en la base ni vuelve en ninguna respuesta.
  cedula: string
  password: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
}

/// Varias peticiones pueden vencer a la vez (varias pestañas, varias llamadas
/// en paralelo): sin esto cada una dispararía su propio POST /auth/refresh.
/// Comparten esta promesa y solo se llama al backend una vez.
let renovacionEnCurso: Promise<boolean> | null = null

function renovarSesion(): Promise<boolean> {
  if (renovacionEnCurso) {
    return renovacionEnCurso
  }

  renovacionEnCurso = (async () => {
    try {
      // Sin body: el refresh token va en la cookie httpOnly, no lo toca JS.
      const session = await request<Session>('/auth/refresh', {
        method: 'POST',
        auth: false,
      })
      setToken(session.accessToken)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    renovacionEnCurso = null
  })

  return renovacionEnCurso
}

// POST /auth/logout borra la cookie httpOnly del refresh token en el servidor:
// JS no puede leerla ni borrarla, y sin esto quedaría viva para el siguiente usuario.
export function logout(): Promise<null> {
  return request<null>('/auth/logout', { method: 'POST', auth: false })
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  reintentado = false,
): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    // Sin esto el navegador no manda (ni guarda) la cookie httpOnly del
    // refresh token en /auth/refresh. Mismo origen siempre (gateway único),
    // así que no hace falta 'include' ni CORS con credenciales.
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    // Access token vencido: se intenta renovar UNA vez con la cookie del
    // refresh token antes de rendirse. `auth` excluye la propia llamada a
    // /auth/refresh, que nunca debe reintentarse a sí misma.
    if (response.status === 401 && auth && !reintentado && (await renovarSesion())) {
      return request<T>(path, options, true)
    }

    // Sigue sin autorizar (o ya se reintentó): se descarta el access token
    // para que el siguiente render mande al login. La cookie del refresh la
    // limpia el propio backend cuando el refresh falla (ver auth.controller).
    if (response.status === 401) {
      setToken(null)
    }

    const detail = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null
    const message = Array.isArray(detail?.message) ? detail.message[0] : detail?.message

    throw new ApiError(message ?? 'No se pudo conectar con el servidor.', response.status)
  }

  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}

// Variante de `request` para la única respuesta no-JSON del API (el PDF del
// certificado); repite el reintento de sesión en vez de compartir código
// porque el cuerpo se lee de dos formas distintas.
async function requestBlob(
  path: string,
  body: unknown,
  reintentado = false,
): Promise<Blob> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    if (response.status === 401 && !reintentado && (await renovarSesion())) {
      return requestBlob(path, body, true)
    }
    if (response.status === 401) {
      setToken(null)
    }
    throw new ApiError('No se pudo generar el certificado.', response.status)
  }

  return response.blob()
}

export function register(credentials: Credentials): Promise<Session> {
  return request<Session>('/auth/register', {
    method: 'POST',
    body: credentials,
    auth: false,
  })
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function fetchMe(): Promise<Participant> {
  return request<Participant>('/auth/me')
}

export function patchMe(cambios: { onboardingVisto: boolean }): Promise<Participant> {
  return request<Participant>('/auth/me', { method: 'PATCH', body: cambios })
}

export function createRun(run: RunPayload): Promise<RunSummary> {
  return request<RunSummary>('/runs', { method: 'POST', body: run })
}

export function fetchMyRuns(): Promise<RunSummary[]> {
  return request<RunSummary[]>('/runs/me')
}

/** 404 si `modulo` no tiene gating configurado en el backend. */
export function fetchProgreso(modulo: string): Promise<Progreso> {
  return request<Progreso>(`/runs/progreso/${modulo}`)
}

// --- Supervisión (solo rol SUPERVISOR) ---

export interface AdminParticipante {
  id: string
  /** El mismo código que identifica las corridas (P001). Es la llave con la
   *  que el supervisor cruza a esta persona con su pre-test y su post-test. */
  seudonimo: string
  nombre: string | null
  apellido: string | null
  email: string | null
  activo: boolean
  createdAt: string
}

/** Una corrida del estudio, seudonimizada. Sin ningún dato personal. */
export interface ResultadoCorrida {
  seudonimo: string
  scenarioId: string
  version: number
  outcome: RunOutcome
  score: number
  endingId: string
  durationMs: number
  startedAt: string
  finishedAt: string
}

export function fetchParticipantes(): Promise<AdminParticipante[]> {
  return request<AdminParticipante[]>('/admin/participantes')
}

export function cambiarEstadoParticipante(
  id: string,
  activo: boolean,
): Promise<AdminParticipante> {
  return request<AdminParticipante>(`/admin/participantes/${id}/estado`, {
    method: 'PATCH',
    body: { activo },
  })
}

export function restablecerPasswordParticipante(id: string): Promise<{ password: string }> {
  return request<{ password: string }>(`/admin/participantes/${id}/restablecer-password`, {
    method: 'POST',
  })
}

export function eliminarParticipante(id: string): Promise<null> {
  return request<null>(`/admin/participantes/${id}`, { method: 'DELETE' })
}

export function fetchResultados(): Promise<ResultadoCorrida[]> {
  return request<ResultadoCorrida[]>('/runs/resultados')
}

// --- Certificado (spec 2026-09-03-gamificacion-y-certificado-design.md) ---

/** Un solo salto a través del cliente: lo firma `entrenamiento` cuando todos
 *  los módulos están aprobados, y `identidad` lo canjea. Vive 5 minutos; el
 *  frontend no la guarda entre pantallas, la pide de nuevo cada vez. */
export interface Certificado {
  codigo: string
  emitidoAt: string
  modulos: string[]
  horas: number
  calificacion: number
}

export interface VerificacionCertificado {
  valido: boolean
  emitidoAt?: string
  horas?: number
  calificacion?: number
  modulos?: string[]
}

/** 409 (`ApiError`) si todavía falta algún módulo por aprobar; el mensaje del
 *  servidor ya lo dice. */
export function fetchAtestacion(): Promise<{ atestacion: string }> {
  return request<{ atestacion: string }>('/runs/atestacion')
}

export function emitirCertificado(atestacion: string): Promise<Certificado> {
  return request<Certificado>('/certificados', { method: 'POST', body: { atestacion } })
}

export function descargarCertificadoPdf(atestacion: string): Promise<Blob> {
  return requestBlob('/certificados/pdf', { atestacion })
}

/** Pública, sin sesión: no pasa por `auth`. */
export function verificarCertificado(codigo: string): Promise<VerificacionCertificado> {
  return request<VerificacionCertificado>(`/certificados/verificar/${codigo}`, { auth: false })
}
