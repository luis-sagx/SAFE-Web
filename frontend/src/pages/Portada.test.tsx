import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Portada from './Portada'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }))
vi.mock('../components/AppHeader', () => ({ default: () => <header>SAFE-Web</header> }))

function renderPage() {
  render(
    <MemoryRouter>
      <Portada />
    </MemoryRouter>,
  )
}

describe('Portada', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isSupervisor: false })
  })

  it('presenta la introducción, los ocho videos y el acceso a una persona visitante', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Aprende a usar SAFE-Web' })).toBeDefined()
    expect(screen.getByText(/situaciones simuladas/i)).toBeDefined()
    expect(screen.getAllByText('Video próximamente')).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/login')
  })

  it('lleva a un participante autenticado a su entrenamiento', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isSupervisor: false })
    renderPage()

    expect(screen.getByRole('link', { name: 'Ir a mi entrenamiento' }).getAttribute('href')).toBe('/dashboard')
  })

  it('lleva a un supervisor autenticado a administración', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isSupervisor: true })
    renderPage()

    expect(screen.getByRole('link', { name: 'Ir a administración' }).getAttribute('href')).toBe('/admin')
  })
})
