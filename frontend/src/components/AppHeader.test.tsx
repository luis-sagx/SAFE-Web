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
  it('para un participante, la marca lleva al panel y muestra la ayuda', () => {
    useAuthMock.mockReturnValue({ isSupervisor: false })

    renderHeader()

    expect(screen.getByRole('link', { name: 'SafeWeb' }).getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('link', { name: 'Qué son los tipos de engaño y qué pasa con tus datos' })).toBeDefined()
  })

  // El supervisor no juega escenarios, así que la marca lo lleva a su propio
  // panel y no al del participante, y la ayuda —que explica los tipos de
  // engaño— no le sirve de nada.
  it('para un supervisor, la marca lleva a su panel y oculta la ayuda', () => {
    useAuthMock.mockReturnValue({ isSupervisor: true })

    renderHeader()

    expect(screen.getByRole('link', { name: 'SafeWeb' }).getAttribute('href')).toBe('/admin')
    expect(screen.queryByRole('link', { name: 'Información' })).toBeNull()
  })
})
