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

interface AuthValue {
  participant: Participant | null
  loading: boolean
  isAuthenticated: boolean
  /** El supervisor gestiona cuentas y ve resultados; no hace escenarios. */
  isSupervisor: boolean
  login: (email: string, password: string) => Promise<Participant>
  register: (credentials: Credentials) => Promise<Participant>
  logout: () => void
  /** true: la bienvenida no vuelve a aparecer sola. false: reactivarla. */
  marcarOnboardingVisto: (visto: boolean) => Promise<void>
  /** Ya se pasó por la bienvenida en esta sesión: deja salir aunque el
   *  participante haya pedido que vuelva a aparecer en el próximo ingreso. */
  onboardingDismissed: boolean
  displayName: string
  roleLabel: string
  initials: string
  correoSimulado: string
  /** Solo la parte de usuario, sin dominio: el dominio es lo que hay que
   *  aprender a mirar en este módulo. */
  usuarioSimulado: string
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

function firstName(participant: Participant | null): string {
  return participant?.nombre?.trim().split(/\s+/)[0] ?? ''
}

// Dominio inventado, para distinguir de un vistazo el ejercicio de la bandeja real.
const DOMINIO_SIMULADO = 'safeweb.com'

// Deja solo letras sin tilde: "sebastián" o "peña" no sobreviven a un buzón real.
function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

// Si la cuenta no tiene nombre (ya anonimizada), cae a "participante" para no quedar vacía.
function usuarioSimuladoDe(participant: Participant | null): string {
  const nombre = normalizar(participant?.nombre?.trim().split(/\s+/)[0])
  const apellido = normalizar(participant?.apellido?.trim().split(/\s+/)[0])

  return `${nombre}${apellido}` || 'participante'
}

// Si falta el apellido (cuenta anonimizada), cae a las dos primeras palabras del nombre.
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
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)

  // Tras recargar hay token pero no participante en memoria: se rehidrata contra el API.
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

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password)
    api.setToken(session.accessToken)
    setParticipant(session.participant)
    setOnboardingDismissed(false)
    return session.participant
  }, [])

  const register = useCallback(async (credentials: Credentials) => {
    const session = await api.register(credentials)
    api.setToken(session.accessToken)
    setParticipant(session.participant)
    setOnboardingDismissed(false)
    return session.participant
  }, [])

  // La cookie httpOnly del refresh token no la puede borrar JS: hay que pedirlo al
  // servidor, sin esperar la respuesta para cerrar sesión de inmediato.
  const logout = useCallback(() => {
    void api.logout().catch(() => {})
    api.setToken(null)
    setParticipant(null)
    setOnboardingDismissed(false)
  }, [])

  // Se marca "visto" para esta sesión sin importar el valor elegido: desmarcada
  // solo reactiva la bienvenida en el próximo ingreso, no en esta sesión.
  const marcarOnboardingVisto = useCallback(async (visto: boolean) => {
    const actualizado = await api.patchMe({ onboardingVisto: visto })
    setParticipant(actualizado)
    setOnboardingDismissed(true)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      participant,
      loading,
      isAuthenticated: Boolean(participant),
      isSupervisor: participant?.role === 'SUPERVISOR',
      login,
      register,
      logout,
      marcarOnboardingVisto,
      onboardingDismissed,
      displayName: firstName(participant),
      roleLabel: 'Participante',
      initials: initialsOf(participant),
      correoSimulado: `${usuarioSimuladoDe(participant)}@${DOMINIO_SIMULADO}`,
      usuarioSimulado: usuarioSimuladoDe(participant),
    }),
    [participant, loading, login, register, logout, marcarOnboardingVisto, onboardingDismissed],
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
