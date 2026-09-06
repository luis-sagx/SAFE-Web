import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import MenuUsuario from './MenuUsuario'

const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    displayName: 'María',
    initials: 'MP',
    roleLabel: 'Participante',
    isSupervisor: false,
    logout: logoutMock,
  }),
}))

function renderMenu() {
  return render(
    <MemoryRouter>
      <MenuUsuario />
    </MemoryRouter>,
  )
}

describe('MenuUsuario', () => {
  it('cierra sesión desde el menú', () => {
    renderMenu()

    // Cerrado no expone nada: es la razón de que el header dejara de estar
    // amontonado, así que si el contenido se filtrara habría que enterarse.
    expect(screen.queryByRole('menuitem', { name: 'Cerrar sesión' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /María/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(logoutMock).toHaveBeenCalled()
  })

  it('Escape cierra el menú', () => {
    renderMenu()

    const boton = screen.getByRole('button', { name: /María/ })
    fireEvent.click(boton)
    fireEvent.keyDown(boton, { key: 'Escape' })

    expect(screen.queryByRole('menu')).toBeNull()
  })
})
