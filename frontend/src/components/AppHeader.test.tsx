import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AppHeader from './AppHeader'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }))

function renderHeader() {
  return render(
    <MemoryRouter>
      <AppHeader etiqueta="Supervisión" />
    </MemoryRouter>,
  )
}

describe('AppHeader', () => {
  it('para un participante, la marca lleva a la portada y muestra la ayuda', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isSupervisor: false })

    renderHeader()

    expect(screen.getByRole('link', { name: 'SafeWeb' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Qué son los tipos de engaño y qué pasa con tus datos' })).toBeDefined()
  })

  it('para un supervisor, la marca lleva a la portada y oculta la ayuda', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isSupervisor: true })

    renderHeader()

    expect(screen.getByRole('link', { name: 'SafeWeb' }).getAttribute('href')).toBe('/')
    expect(screen.queryByRole('link', { name: 'Información' })).toBeNull()
  })

  it('para una persona visitante, no muestra la ayuda ni el menú de cuenta', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isSupervisor: false })

    renderHeader()

    expect(screen.getByRole('link', { name: 'SafeWeb' }).getAttribute('href')).toBe('/')
    expect(screen.queryByRole('link', { name: 'Información' })).toBeNull()
    expect(screen.queryByRole('button', { name: /Participante|Supervisor/ })).toBeNull()
  })
})
