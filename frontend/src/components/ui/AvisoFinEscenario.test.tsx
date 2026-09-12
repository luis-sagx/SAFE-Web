import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ScenarioEndNotice from './AvisoFinEscenario'

/// El aviso es de la *transición* a terminado, no del estado: el escenario pasa
/// todo el repaso de señales con el resultado puesto y no puede reaparecer en
/// cada paso. Al repetir el escenario sí tiene que volver a salir.
describe('AvisoFinEscenario', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const title = () => screen.queryByText(/Bien resuelto|A medias|No salió bien/)

  it('no aparece mientras el escenario sigue abierto', () => {
    render(<ScenarioEndNotice />)
    expect(title()).toBeNull()
  })

  it('aparece al terminar, con el titular del resultado, y se quita solo', () => {
    const { rerender } = render(<ScenarioEndNotice />)

    rerender(<ScenarioEndNotice resultado="bad" />)
    expect(title()?.textContent).toBe('No salió bien')

    act(() => vi.advanceTimersByTime(1800))
    expect(title()).toBeNull()
  })

  it('no reaparece durante el repaso, que sigue en estado terminado', () => {
    const { rerender } = render(<ScenarioEndNotice />)
    rerender(<ScenarioEndNotice resultado="good" />)
    act(() => vi.advanceTimersByTime(1800))

    // Cada paso del repaso vuelve a renderizar con el resultado puesto.
    rerender(<ScenarioEndNotice resultado="good" />)
    rerender(<ScenarioEndNotice resultado="good" />)
    expect(title()).toBeNull()
  })

  it('vuelve a aparecer al repetir el escenario', () => {
    const { rerender } = render(<ScenarioEndNotice />)
    rerender(<ScenarioEndNotice resultado="good" />)
    act(() => vi.advanceTimersByTime(1800))

    rerender(<ScenarioEndNotice />)
    rerender(<ScenarioEndNotice resultado="partial" />)
    expect(title()?.textContent).toBe('A medias')
  })
})
