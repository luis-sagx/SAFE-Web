import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SoundSelector from './SelectorSonido'

const { useSoundMock, setActivadoMock } = vi.hoisted(() => ({
  useSoundMock: vi.fn(),
  setActivadoMock: vi.fn(),
}))

vi.mock('../context/SoundContext', () => ({ useSound: useSoundMock }))

describe('SelectorSonido', () => {
  beforeEach(() => {
    setActivadoMock.mockReset()
    useSoundMock.mockReturnValue({ activado: true, setActivado: setActivadoMock })
  })

  it('con el sonido activado, el botón lo dice y al tocarlo lo apaga', () => {
    render(<SoundSelector />)

    const button = screen.getByRole('switch', { name: 'Sonido' })
    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('Activado')).toBeDefined()

    fireEvent.click(button)
    expect(setActivadoMock).toHaveBeenCalledWith(false)
  })

  it('con el sonido desactivado, el botón lo dice y al tocarlo lo prende', () => {
    useSoundMock.mockReturnValue({ activado: false, setActivado: setActivadoMock })
    render(<SoundSelector />)

    const button = screen.getByRole('switch', { name: 'Sonido' })
    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('Desactivado')).toBeDefined()

    fireEvent.click(button)
    expect(setActivadoMock).toHaveBeenCalledWith(true)
  })
})
