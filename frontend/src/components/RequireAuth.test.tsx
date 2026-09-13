import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { setToken } from '../lib/api'
import RequireAuth from './RequireAuth'

const { fetchMeMock, patchMeMock } = vi.hoisted(() => ({
  fetchMeMock: vi.fn(),
  patchMeMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchMe: fetchMeMock, patchMe: patchMeMock }
})

function participant(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    nombre: 'María',
    apellido: 'Pérez',
    email: 'maria@ejemplo.com',
    role: 'PARTICIPANT',
    onboardingVisto: true,
    ...overrides,
  }
}

function renderRoute(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Pantalla de acceso</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<p>Zona del participante</p>} />
            <Route path="/bienvenida" element={<p>Pantalla de bienvenida</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

// Repite lo que hace Bienvenida.tsx al continuar con el checkbox
// desmarcado: pide onboardingVisto: false y navega a /dashboard.
function ContinueWithUncheckedCheckbox() {
  const { marcarOnboardingVisto: markOnboardingAsSeen } = useAuth()
  const navigate = useNavigate()

  return (
    <button
      onClick={async () => {
        await markOnboardingAsSeen(false)
        navigate('/dashboard')
      }}
    >
      Continuar
    </button>
  )
}

function renderWelcomeWithContinue() {
  return render(
    <MemoryRouter initialEntries={['/bienvenida']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Pantalla de acceso</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<p>Zona del participante</p>} />
            <Route path="/bienvenida" element={<ContinueWithUncheckedCheckbox />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMeMock.mockReset()
  })

  it('manda al acceso cuando no hay sesión', async () => {
    renderRoute('/dashboard')

    expect(await screen.findByText('Pantalla de acceso')).toBeDefined()
  })

  it('deja pasar cuando el token rehidrata una sesión que ya vio la bienvenida', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant())

    renderRoute('/dashboard')

    expect(await screen.findByText('Zona del participante')).toBeDefined()
  })

  it('manda al acceso cuando el token guardado ya no sirve', async () => {
    setToken('vencido')
    fetchMeMock.mockRejectedValue(new Error('401'))

    renderRoute('/dashboard')

    await waitFor(() => {
      expect(screen.getByText('Pantalla de acceso')).toBeDefined()
    })
  })

  it('muestra el estado de carga mientras rehidrata', () => {
    setToken('t0ken')
    fetchMeMock.mockReturnValue(new Promise(() => {}))

    renderRoute('/dashboard')

    expect(screen.getByText('Cargando…')).toBeDefined()
  })

  // El primer ingreso, o volver a activar el aviso desde el ícono ⓘ.
  it('manda a la bienvenida antes que al dashboard si onboardingVisto es false', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant({ onboardingVisto: false }))

    renderRoute('/dashboard')

    expect(await screen.findByText('Pantalla de bienvenida')).toBeDefined()
  })

  // Sin esto, cada render de /bienvenida con onboardingVisto en false
  // rebotaría de vuelta a /bienvenida en un bucle.
  it('no rebota si ya está en /bienvenida', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant({ onboardingVisto: false }))

    renderRoute('/bienvenida')

    expect(await screen.findByText('Pantalla de bienvenida')).toBeDefined()
  })

  // Bug: dejar el checkbox "no volver a mostrar" desmarcado y continuar
  // rebotaba de nuevo a /bienvenida porque onboardingVisto seguía en false,
  // atrapando al participante ahí sin poder avanzar.
  it('deja salir al dashboard al continuar aunque el checkbox quede desmarcado', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(participant({ onboardingVisto: false }))
    patchMeMock.mockResolvedValue(participant({ onboardingVisto: false }))

    renderWelcomeWithContinue()

    fireEvent.click(await screen.findByText('Continuar'))

    expect(await screen.findByText('Zona del participante')).toBeDefined()
  })
})
