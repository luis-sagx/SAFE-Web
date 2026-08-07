import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AvisoFinEscenario from './AvisoFinEscenario'

/// El aviso es de la *transición* a terminado, no del estado: el escenario pasa
/// todo el repaso de señales con el resultado puesto y no puede reaparecer en
/// cada paso. Al repetir el escenario sí tiene que volver a salir.
describe('AvisoFinEscenario', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const titulo = () => screen.queryByText(/Bien resuelto|A medias|No salió bien/)

  it('no aparece mientras el escenario sigue abierto', () => {
    render(<AvisoFinEscenario />)
    expect(titulo()).toBeNull()
  })

  it('aparece al terminar, con el titular del resultado, y se quita solo', () => {
    const { rerender } = render(<AvisoFinEscenario />)

    rerender(<AvisoFinEscenario resultado="bad" />)
    expect(titulo()?.textContent).toBe('No salió bien')

    act(() => vi.advanceTimersByTime(1800))
    expect(titulo()).toBeNull()
  })

  it('no reaparece durante el repaso, que sigue en estado terminado', () => {
    const { rerender } = render(<AvisoFinEscenario />)
    rerender(<AvisoFinEscenario resultado="good" />)
    act(() => vi.advanceTimersByTime(1800))

    // Cada paso del repaso vuelve a renderizar con el resultado puesto.
    rerender(<AvisoFinEscenario resultado="good" />)
    rerender(<AvisoFinEscenario resultado="good" />)
    expect(titulo()).toBeNull()
  })

  it('vuelve a aparecer al repetir el escenario', () => {
    const { rerender } = render(<AvisoFinEscenario />)
    rerender(<AvisoFinEscenario resultado="good" />)
    act(() => vi.advanceTimersByTime(1800))

    rerender(<AvisoFinEscenario />)
    rerender(<AvisoFinEscenario resultado="partial" />)
    expect(titulo()?.textContent).toBe('A medias')
  })
})
