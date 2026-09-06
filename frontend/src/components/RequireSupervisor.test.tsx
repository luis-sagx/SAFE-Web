import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RequireSupervisor from './RequireSupervisor'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }))

function renderRuta() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<p>Pantalla de acceso</p>} />
        <Route path="/dashboard" element={<p>Zona del participante</p>} />
        <Route element={<RequireSupervisor />}>
          <Route path="/admin" element={<p>Panel de supervisión</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireSupervisor', () => {
  it('muestra la pantalla de carga mientras resuelve la sesión', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, loading: true, isSupervisor: false })

    renderRuta()

    expect(screen.getByRole('status')).toBeDefined()
  })

  it('manda al acceso sin sesión', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, loading: false, isSupervisor: false })

    renderRuta()

    expect(screen.getByText('Pantalla de acceso')).toBeDefined()
  })

  it('manda al panel del participante si la sesión no es de supervisor', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, loading: false, isSupervisor: false })

    renderRuta()

    expect(screen.getByText('Zona del participante')).toBeDefined()
  })

  it('deja pasar a un supervisor autenticado', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, loading: false, isSupervisor: true })

    renderRuta()

    expect(screen.getByText('Panel de supervisión')).toBeDefined()
  })
})
