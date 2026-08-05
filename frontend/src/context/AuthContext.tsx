import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as api from '../lib/api'
import type { Credentials, Participant } from '../lib/api'
import { flushPendingRuns } from '../lib/pendingRuns'

interface AuthValue {
  participant: Participant | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<Participant>
  register: (credentials: Credentials) => Promise<Participant>
  logout: () => void
  /** true: la bienvenida no vuelve a aparecer sola. false: reactivarla. */
  marcarOnboardingVisto: (visto: boolean) => Promise<void>
  displayName: string
  roleLabel: string
  initials: string
  /** Dirección de correo ficticia del participante dentro de los escenarios. */
  correoSimulado: string
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

function firstName(participant: Participant | null): string {
  return participant?.nombre?.trim().split(/\s+/)[0] ?? ''
}

/// Dominio inventado. Nunca existe fuera de la simulación: los escenarios no
/// envían ni reciben correo de verdad, y el participante tiene que poder
/// distinguir de un vistazo lo que pasa dentro del ejercicio de lo que pasa en
/// su bandeja real.
const DOMINIO_SIMULADO = 'safeweb.com'

/// Deja solo letras sin tilde: la dirección tiene que poder escribirse y
/// leerse en voz alta, y "sebastián" o "peña" no sobreviven a un buzón real.
function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

/// nombreapellido@safeweb.com, con la primera palabra de cada uno. Si la cuenta
/// no tiene nombre —la del investigador, o una ya anonimizada— cae a
/// "participante", para que la dirección nunca quede vacía ni a medias.
function correoSimuladoDe(participant: Participant | null): string {
  const nombre = normalizar(participant?.nombre?.trim().split(/\s+/)[0])
  const apellido = normalizar(participant?.apellido?.trim().split(/\s+/)[0])

  return `${`${nombre}${apellido}` || 'participante'}@${DOMINIO_SIMULADO}`
}

/// Inicial del nombre + inicial del apellido. Si falta el apellido —la cuenta
/// de investigador, o una ya anonimizada— cae a las dos primeras palabras del
/// nombre, que es lo que hacía antes de que el apellido existiera.
function initialsOf(participant: Participant | null): string {
  const nombre = participant?.nombre?.trim().split(/\s+/) ?? []
  const apellido = participant?.apellido?.trim().split(/\s+/) ?? []

  const partes = apellido.length > 0 ? [nombre[0], apellido[0]] : nombre.slice(0, 2)
  const letras = partes.map((parte) => parte?.[0]?.toUpperCase() ?? '').join('')

  return letras || 'TU'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(Boolean(api.getToken()))

  // Tras recargar hay token pero no participante en memoria: se rehidrata
  // contra el API, que de paso valida que el token siga vivo.
  useEffect(() => {
    if (!api.getToken()) {
      return
    }

    let cancelled = false

    api
      .fetchMe()
      .then((me) => {
        if (!cancelled) setParticipant(me)
      })
      .catch(() => {
        if (!cancelled) setParticipant(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (participant) {
      void flushPendingRuns()
    }
  }, [participant])

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password)
    api.setToken(session.accessToken)
    setParticipant(session.participant)
    return session.participant
  }, [])

  const register = useCallback(async (credentials: Credentials) => {
    const session = await api.register(credentials)
    api.setToken(session.accessToken)
    setParticipant(session.participant)
    return session.participant
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setParticipant(null)
  }, [])

  const marcarOnboardingVisto = useCallback(async (visto: boolean) => {
    const actualizado = await api.patchMe({ onboardingVisto: visto })
    setParticipant(actualizado)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      participant,
      loading,
      isAuthenticated: Boolean(participant),
      login,
      register,
      logout,
      marcarOnboardingVisto,
      displayName: firstName(participant),
      roleLabel: participant?.cohort ?? 'Participante',
      initials: initialsOf(participant),
      correoSimulado: correoSimuladoDe(participant),
    }),
    [participant, loading, login, register, logout, marcarOnboardingVisto],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }

  return context
}
