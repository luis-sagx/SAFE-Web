import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeSelector from './SelectorTema'

const { useThemeMock, setPreferenciaMock: setPreferenceMock } = vi.hoisted(() => ({
  useThemeMock: vi.fn(),
  setPreferenciaMock: vi.fn(),
}))

vi.mock('../context/ThemeContext', () => ({ useTheme: useThemeMock }))

describe('SelectorTema', () => {
  beforeEach(() => {
    setPreferenceMock.mockReset()
    useThemeMock.mockReturnValue({
      preferencia: 'claro',
      temaEfectivo: 'claro',
      setPreferencia: setPreferenceMock,
    })
  })

  it('dos opciones apiladas, y solo la activa lleva el check', () => {
    render(<ThemeSelector />)

    expect(screen.getAllByRole('radio')).toHaveLength(2)

    // El check es el único indicio visual además del texto (SC 1.4.1): solo
    // debe aparecer junto a la opción activa.
    const active = screen.getByRole('radio', { name: 'Claro' })
    expect(active.querySelector('svg.lucide-check')).not.toBeNull()

    const inactive = screen.getByRole('radio', { name: 'Oscuro' })
    expect(inactive.querySelector('svg.lucide-check')).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(setPreferenceMock).toHaveBeenCalledWith('oscuro')
  })
})
