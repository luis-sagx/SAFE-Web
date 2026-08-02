import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { setToken } from '../lib/api'
import RequireAuth from './RequireAuth'

const { fetchMeMock } = vi.hoisted(() => ({ fetchMeMock: vi.fn() }))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchMe: fetchMeMock }
})

function renderRuta(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Pantalla de acceso</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<p>Zona del participante</p>} />
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
    renderRuta('/dashboard')

    expect(await screen.findByText('Pantalla de acceso')).toBeDefined()
  })

  it('deja pasar cuando el token rehidrata una sesión válida', async () => {
    setToken('t0ken')
    fetchMeMock.mockResolvedValue({
      id: 'p1',
      nombre: 'María Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      cohort: null,
    })

    renderRuta('/dashboard')

    expect(await screen.findByText('Zona del participante')).toBeDefined()
  })

  it('manda al acceso cuando el token guardado ya no sirve', async () => {
    setToken('vencido')
    fetchMeMock.mockRejectedValue(new Error('401'))

    renderRuta('/dashboard')

    await waitFor(() => {
      expect(screen.getByText('Pantalla de acceso')).toBeDefined()
    })
  })

  it('muestra el estado de carga mientras rehidrata', () => {
    setToken('t0ken')
    fetchMeMock.mockReturnValue(new Promise(() => {}))

    renderRuta('/dashboard')

    expect(screen.getByText('Cargando…')).toBeDefined()
  })
})
