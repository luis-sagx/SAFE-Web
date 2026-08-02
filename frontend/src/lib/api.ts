// Único punto de contacto con el backend: ningún componente llama a fetch.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'mic-access-token'

export interface Participant {
  id: string
  nombre: string | null
  email: string | null
  role: 'PARTICIPANT' | 'RESEARCHER'
  cohort: string | null
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

export interface Credentials {
  nombre: string
  email: string
  telefono: string
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    // Token vencido: se descarta para que el siguiente render mande al login.
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

export function createRun(run: RunPayload): Promise<RunSummary> {
  return request<RunSummary>('/runs', { method: 'POST', body: run })
}

export function fetchMyRuns(): Promise<RunSummary[]> {
  return request<RunSummary[]>('/runs/me')
}
