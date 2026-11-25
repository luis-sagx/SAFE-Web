import { act, fireEvent, render, screen } from '@testing-library/react'
import { Toaster, toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INACTIVITY_LIMIT_MS, INACTIVITY_WARNING_MS } from '../hooks/useInactivityLogout'
import { getToken, setToken } from '../lib/api'
import { AuthProvider, useAuth } from './AuthContext'

const { fetchMeMock, loginMock, logoutMock } = vi.hoisted(() => ({
  fetchMeMock: vi.fn(),
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchMe: fetchMeMock, login: loginMock, logout: logoutMock }
})

const PARTICIPANT = {
  id: 'p1',
  nombre: 'María',
  apellido: 'Pérez',
  email: 'maria@ejemplo.com',
  role: 'PARTICIPANT',
  onboardingVisto: true,
}

const NOTICE = 'Tu sesión se cerró por inactividad.'

function SessionStatus() {
  const { isAuthenticated, loading, login } = useAuth()
  if (loading) return <p>Cargando</p>
  return (
    <>
      <p>{isAuthenticated ? 'Con sesión' : 'Sin sesión'}</p>
      <button onClick={() => void login('maria@ejemplo.com', 'clave')}>Entrar</button>
    </>
  )
}

async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms))
}

async function renderSession() {
  render(
    <AuthProvider>
      <Toaster />
      <SessionStatus />
    </AuthProvider>,
  )
  await advance(0)
}

describe('AuthProvider: cierre por inactividad', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setToken('t0ken')
    fetchMeMock.mockReset().mockResolvedValue(PARTICIPANT)
    loginMock.mockReset().mockResolvedValue({ accessToken: 'nuevo', participant: PARTICIPANT })
    logoutMock.mockReset().mockResolvedValue(null)
  })

  afterEach(() => {
    // sonner guarda los avisos en un estado global que sobrevive al desmontaje.
    toast.dismiss()
    vi.useRealTimers()
  })

  it('cierra la sesión, borra las credenciales y avisa a los 15 minutos', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 1_000)
    expect(screen.getByText('Con sesión')).toBeDefined()

    await advance(6_000)

    expect(screen.getByText('Sin sesión')).toBeDefined()
    expect(getToken()).toBeNull()
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText(NOTICE)).toBeDefined()
  })

  it.each(['pointerMove', 'keyDown', 'scroll'] as const)('la actividad (%s) reinicia el plazo', async (event) => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 120_000)
    fireEvent[event](document.body)
    await advance(INACTIVITY_LIMIT_MS - 120_000)

    expect(screen.getByText('Con sesión')).toBeDefined()
  })

  it('la actividad en otra pestaña mantiene la sesión', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 120_000)
    localStorage.setItem('mic-last-activity', String(Date.now()))
    await advance(INACTIVITY_LIMIT_MS - 120_000)

    expect(screen.getByText('Con sesión')).toBeDefined()
  })

  it('al despertar un equipo suspendido, el primer movimiento no revive la sesión', async () => {
    await renderSession()
    // Adelanta el reloj sin disparar temporizadores, como una suspensión.
    vi.setSystemTime(Date.now() + INACTIVITY_LIMIT_MS)
    fireEvent.pointerMove(document.body)
    await advance(0)

    expect(screen.getByText('Sin sesión')).toBeDefined()
  })

  it('al volver a abrir la página pasado el límite no rehidrata la sesión', async () => {
    localStorage.setItem('mic-last-activity', String(Date.now() - INACTIVITY_LIMIT_MS))
    await renderSession()
    await advance(100)

    expect(screen.getByText('Sin sesión')).toBeDefined()
    expect(fetchMeMock).not.toHaveBeenCalled()
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(getToken()).toBeNull()
    expect(screen.getByText(NOTICE)).toBeDefined()
  })

  it('volver a entrar después del cierre empieza un plazo nuevo', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS + 5_000)
    await advance(INACTIVITY_LIMIT_MS)
    fireEvent.click(screen.getByText('Entrar'))
    await advance(INACTIVITY_LIMIT_MS - 120_000)
    // La salida del aviso se anima en un render aparte.
    await advance(1_000)

    expect(screen.getByText('Con sesión')).toBeDefined()
    expect(screen.queryByText(NOTICE)).toBeNull()
  })

  it('avisa un minuto antes con la cuenta regresiva', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - INACTIVITY_WARNING_MS - 1_000)
    expect(screen.queryByRole('dialog')).toBeNull()

    await advance(1_000)
    expect(screen.getByRole('dialog', { name: '¿Sigues ahí?' }).textContent).toContain('60 segundos')

    await advance(59_000)
    expect(screen.getByRole('dialog').textContent).toContain('1 segundo.')

    await advance(1_000)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Sin sesión')).toBeDefined()
  })

  it.each([
    ['el botón', () => fireEvent.click(screen.getByRole('button', { name: 'Seguir conectado' }))],
    ['Escape', () => fireEvent.keyDown(document.body, { key: 'Escape' })],
  ])('seguir conectado con %s cierra el aviso y empieza un plazo nuevo', async (_name, stay) => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 30_000)
    stay()
    expect(screen.queryByRole('dialog')).toBeNull()

    await advance(INACTIVITY_LIMIT_MS - 120_000)
    expect(screen.getByText('Con sesión')).toBeDefined()
    expect(logoutMock).not.toHaveBeenCalled()
  })

  it('con el aviso abierto, mover el mouse no renueva la sesión', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 30_000)
    fireEvent.pointerMove(document.body)
    await advance(30_000)

    expect(screen.getByText('Sin sesión')).toBeDefined()
  })

  it('responder el aviso en otra pestaña lo cierra en esta', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 30_000)
    localStorage.setItem('mic-last-activity', String(Date.now()))
    await advance(1_000)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Con sesión')).toBeDefined()
  })

  it('responder el aviso cuando ya venció no revive la sesión', async () => {
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS - 30_000)
    vi.setSystemTime(Date.now() + 60_000)
    fireEvent.click(screen.getByRole('button', { name: 'Seguir conectado' }))

    expect(screen.getByText('Sin sesión')).toBeDefined()
  })

  it('sin sesión no hay nada que cerrar', async () => {
    setToken(null)
    await renderSession()
    await advance(INACTIVITY_LIMIT_MS * 2)

    expect(logoutMock).not.toHaveBeenCalled()
    expect(screen.queryByText(NOTICE)).toBeNull()
  })
})
