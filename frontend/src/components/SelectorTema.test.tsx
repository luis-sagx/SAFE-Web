import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SelectorTema from './SelectorTema'

const { useThemeMock, setPreferenciaMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
  setPreferenciaMock: vi.fn(),
}))

vi.mock('../context/ThemeContext', () => ({ useTheme: useThemeMock }))

describe('SelectorTema', () => {
  beforeEach(() => {
    setPreferenciaMock.mockReset()
    useThemeMock.mockReturnValue({
      preferencia: 'claro',
      temaEfectivo: 'claro',
      setPreferencia: setPreferenciaMock,
    })
  })

  it('variante segmentado (por defecto): tres opciones, la activa marcada', () => {
    render(<SelectorTema />)

    const opciones = screen.getAllByRole('radio')
    expect(opciones).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Claro' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'Sistema' }).getAttribute('aria-checked')).toBe('false')

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(setPreferenciaMock).toHaveBeenCalledWith('oscuro')
  })

  it('variante lista: apiladas, y solo la activa lleva el check', () => {
    render(<SelectorTema variante="lista" />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)

    // El check es el único indicio visual además del texto (SC 1.4.1): solo
    // debe aparecer junto a la opción activa.
    const activa = screen.getByRole('radio', { name: 'Claro' })
    expect(activa.querySelector('svg.lucide-check')).not.toBeNull()

    const inactiva = screen.getByRole('radio', { name: 'Sistema' })
    expect(inactiva.querySelector('svg.lucide-check')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Sistema' }))
    expect(setPreferenciaMock).toHaveBeenCalledWith('sistema')
  })
})
