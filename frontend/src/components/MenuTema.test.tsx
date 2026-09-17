import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeMenu from './MenuTema'

const { useThemeMock, setPreferenceMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
  setPreferenceMock: vi.fn(),
}))

vi.mock('../context/ThemeContext', () => ({ useTheme: useThemeMock }))

describe('MenuTema', () => {
  beforeEach(() => {
    setPreferenceMock.mockReset()
    useThemeMock.mockReturnValue({
      preferencia: 'oscuro',
      temaEfectivo: 'oscuro',
      setPreferencia: setPreferenceMock,
    })
  })

  it('muestra un solo botón con el tema actual y las opciones ocultas', () => {
    render(<ThemeMenu />)

    const button = screen.getByRole('button', { name: /Tema.*Oscuro/ })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('abre las tres opciones, elige una y se cierra devolviendo el foco', () => {
    render(<ThemeMenu />)
    const button = screen.getByRole('button', { name: /Tema/ })

    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByRole('radio')).toHaveLength(3)

    fireEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(setPreferenceMock).toHaveBeenCalledWith('claro')
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(document.activeElement).toBe(button)
  })

  it('se cierra con Escape', () => {
    render(<ThemeMenu />)
    fireEvent.click(screen.getByRole('button', { name: /Tema/ }))

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Escape' })
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })
})
