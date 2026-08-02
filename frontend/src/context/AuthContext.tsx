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
  displayName: string
  roleLabel: string
  initials: string
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

function firstName(participant: Participant | null): string {
  return participant?.nombre?.trim().split(/\s+/)[0] ?? ''
}

function initialsOf(participant: Participant | null): string {
  const parts = participant?.nombre?.trim().split(/\s+/).slice(0, 2) ?? []
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
  return letters || 'TU'
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

  const value = useMemo<AuthValue>(
    () => ({
      participant,
      loading,
      isAuthenticated: Boolean(participant),
      login,
      register,
      logout,
      displayName: firstName(participant),
      roleLabel: participant?.cohort ?? 'Participante',
      initials: initialsOf(participant),
    }),
    [participant, loading, login, register, logout],
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
