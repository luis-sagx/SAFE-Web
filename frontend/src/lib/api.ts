// Único punto de contacto con el backend: ningún componente llama a fetch.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Los tokens van en localStorage, no en una cookie httpOnly. El access token
// vive minutos (15 min) y solo da acceso a los datos del propio participante,
// nunca a un dato personal de otro. El riesgo de un XSS que los robara queda
// acotado por la CSP de nginx: `script-src 'self'` no ejecuta script inyectado
// y `connect-src 'self'` impide enviarlo a otro origen. Migrar a cookie
// httpOnly (con su manejo de CSRF) queda como endurecimiento posterior — el
// refresh token queda con el mismo perfil de riesgo que el access token
// mientras eso no se haga.
const TOKEN_KEY = 'mic-access-token'
const REFRESH_TOKEN_KEY = 'mic-refresh-token'

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
  refreshToken: string
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

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
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
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      return false
    }

    try {
      const session = await request<Session>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      })
      setToken(session.accessToken)
      setRefreshToken(session.refreshToken)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    renovacionEnCurso = null
  })

  return renovacionEnCurso
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
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    // Access token vencido: se intenta renovar UNA vez con el refresh token
    // antes de rendirse. `auth` excluye la propia llamada a /auth/refresh, que
    // nunca debe reintentarse a sí misma.
    if (response.status === 401 && auth && !reintentado && (await renovarSesion())) {
      return request<T>(path, options, true)
    }

    // Sigue sin autorizar (o ya se reintentó): se descartan los tokens para
    // que el siguiente render mande al login.
    if (response.status === 401) {
      setToken(null)
      setRefreshToken(null)
    }

    const detail = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null
    const message = Array.isArray(detail?.message) ? detail.message[0] : detail?.message

    throw new ApiError(message ?? 'No se pudo conectar con el servidor.', response.status)
  }

  return response.status === 204 ? (null as T) : ((await response.json()) as T)
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
