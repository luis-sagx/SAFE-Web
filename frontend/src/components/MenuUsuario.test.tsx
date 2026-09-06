import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MenuUsuario from './MenuUsuario'

const { useAuthMock, logoutMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }))

function renderMenu() {
  return render(
    <MemoryRouter>
      <MenuUsuario />
    </MemoryRouter>,
  )
}

describe('MenuUsuario', () => {
  beforeEach(() => {
    logoutMock.mockReset()
    useAuthMock.mockReturnValue({
      displayName: 'María',
      initials: 'MP',
      roleLabel: 'Participante',
      isSupervisor: false,
      logout: logoutMock,
    })
  })

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

  // El clic fuera es lo que de verdad cierra el menú en el uso normal: Escape
  // es el atajo de teclado, pero perder el foco del grupo entero (clic en
  // cualquier otro punto de la página) tiene que cerrarlo igual.
  it('perder el foco del grupo cierra el menú', () => {
    renderMenu()

    const boton = screen.getByRole('button', { name: /María/ })
    fireEvent.click(boton)
    fireEvent.blur(boton, { relatedTarget: document.body })

    expect(screen.queryByRole('menu')).toBeNull()
  })

  // El foco puede salir del botón hacia dentro del propio menú (tabulando
  // hacia un ítem): eso no es "salir del grupo" y no debe cerrarlo.
  it('el foco moviéndose dentro del menú no lo cierra', () => {
    renderMenu()

    const boton = screen.getByRole('button', { name: /María/ })
    fireEvent.click(boton)
    fireEvent.blur(boton, { relatedTarget: screen.getByRole('menu') })

    expect(screen.getByRole('menu')).toBeDefined()
  })

  // Otra tecla, o Escape con el menú ya cerrado, no debe intentar cerrarlo de
  // nuevo ni mover el foco.
  it('otra tecla no cierra el menú, y Escape sin el menú abierto no hace nada', () => {
    renderMenu()

    const boton = screen.getByRole('button', { name: /María/ })
    fireEvent.keyDown(boton, { key: 'Escape' })

    fireEvent.click(boton)
    fireEvent.keyDown(boton, { key: 'a' })

    expect(screen.getByRole('menu')).toBeDefined()
  })

  it('"Tu recorrido" cierra el menú al elegirlo', () => {
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /María/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tu recorrido' }))

    expect(screen.queryByRole('menu')).toBeNull()
  })

  // El supervisor no juega escenarios: no tiene recorrido que consultar, y su
  // nombre puede llegar vacío (una cuenta anonimizada), así que el rótulo cae
  // a "Supervisor" en vez de a "Participante".
  it('para un supervisor sin nombre, no ofrece "Tu recorrido" y usa el rótulo de repuesto', () => {
    useAuthMock.mockReturnValue({
      displayName: '',
      initials: '',
      roleLabel: 'Participante',
      isSupervisor: true,
      logout: logoutMock,
    })

    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /Supervisor/ }))

    expect(screen.queryByRole('menuitem', { name: 'Tu recorrido' })).toBeNull()
    expect(screen.getAllByText('Supervisor').length).toBeGreaterThan(0)
  })
})
