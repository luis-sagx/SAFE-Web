import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RiskGauge from './RiskGauge'

describe('RiskGauge', () => {
  it('renderiza sin errores', () => {
    const { container } = render(
      <RiskGauge label="Risk Level" percent={50} valueText="50%" color="red" />,
    )
    expect(container).toBeDefined()
  })

  it('renderiza label correctamente', () => {
    render(<RiskGauge label="Danger Level" percent={75} valueText="75%" color="orange" />)
    expect(screen.getByText('Danger Level')).toBeDefined()
  })

  it('renderiza valueText correctamente', () => {
    render(<RiskGauge label="Risk" percent={30} valueText="30%" color="green" />)
    expect(screen.getByText('30%')).toBeDefined()
  })

  it('aplica el color al gauge fill', () => {
    const { container } = render(
      <RiskGauge label="Test" percent={60} valueText="60%" color="red" />,
    )
    const fill = container.querySelector('[class*="gaugeFill"]') as HTMLElement
    expect(fill?.style.background).toBe('red')
  })

  it('renderiza con diferentes porcentajes', () => {
    const { rerender, container } = render(
      <RiskGauge label="Risk" percent={25} valueText="25%" color="green" />,
    )
    let fill = container.querySelector('[class*="gaugeFill"]') as HTMLElement
    expect(fill?.style.width).toBe('25%')

    rerender(<RiskGauge label="Risk" percent={75} valueText="75%" color="red" />)
    fill = container.querySelector('[class*="gaugeFill"]') as HTMLElement
    expect(fill?.style.width).toBe('75%')
  })
})
