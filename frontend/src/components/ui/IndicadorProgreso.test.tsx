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

  it('calcula el porcentaje correctamente', () => {
    const { container } = render(<IndicadorProgreso posicion={1} total={4} titulo="Test" />)
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(progressBar?.style.width).toBe('25%')
  })

  it('tiene atributos aria correctos', () => {
    const { container } = render(<IndicadorProgreso posicion={5} total={10} titulo="Test" />)
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('5')
    expect(progressBar?.getAttribute('aria-valuemin')).toBe('1')
    expect(progressBar?.getAttribute('aria-valuemax')).toBe('10')
  })

  it('tiene aria-label descriptivo', () => {
    const { container } = render(<IndicadorProgreso posicion={2} total={5} titulo="Test" />)
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(progressBar?.getAttribute('aria-label')).toContain('2 de 5')
  })
})
