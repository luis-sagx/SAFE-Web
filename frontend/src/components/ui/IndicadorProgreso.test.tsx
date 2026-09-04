import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IndicadorProgreso from './IndicadorProgreso'

describe('IndicadorProgreso', () => {
  it('renderiza sin errores con valores válidos', () => {
    const { container } = render(<IndicadorProgreso posicion={1} total={5} titulo="Progreso" />)
    expect(container).toBeDefined()
  })

  it('muestra el título correctamente', () => {
    render(<IndicadorProgreso posicion={2} total={5} titulo="Mi Progreso" />)
    expect(screen.getByText('Mi Progreso')).toBeDefined()
  })

  it('muestra la posición y total correctamente', () => {
    render(<IndicadorProgreso posicion={3} total={10} titulo="Escenarios" />)
    expect(screen.getByText('3 de 10')).toBeDefined()
  })

  it('retorna null cuando posición es <= 0', () => {
    const { container } = render(<IndicadorProgreso posicion={0} total={5} titulo="Test" />)
    expect(container.firstChild).toBeNull()
  })

  it('retorna null cuando total es <= 0', () => {
    const { container } = render(<IndicadorProgreso posicion={1} total={0} titulo="Test" />)
    expect(container.firstChild).toBeNull()
  })

  it('usa el elemento nativo <progress> con value y max correctos', () => {
    const { container } = render(<IndicadorProgreso posicion={1} total={4} titulo="Test" />)
    const progressBar = container.querySelector('progress') as HTMLProgressElement
    expect(progressBar?.value).toBe(1)
    expect(progressBar?.max).toBe(4)
  })

  it('tiene aria-label descriptivo', () => {
    const { container } = render(<IndicadorProgreso posicion={2} total={5} titulo="Test" />)
    const progressBar = container.querySelector('progress') as HTMLElement
    expect(progressBar?.getAttribute('aria-label')).toContain('2 de 5')
  })
})
