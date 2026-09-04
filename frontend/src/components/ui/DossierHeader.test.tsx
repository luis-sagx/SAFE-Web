import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DossierHeader from './DossierHeader'

describe('DossierHeader', () => {
  const defaultProps = {
    caseLabel: 'Caso #1',
    secondTab: 'Detalles',
    riskLabel: 'Riesgo',
    gaugePercent: 50,
    gaugeValueText: '50%',
    gaugeColor: 'red',
    participantName: 'Juan',
    participantRole: 'Investigador',
  }

  it('renderiza sin errores', () => {
    const { container } = render(<DossierHeader {...defaultProps} />)
    expect(container).toBeDefined()
  })

  it('renderiza el caseLabel', () => {
    render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText('Caso #1')).toBeDefined()
  })

  it('renderiza el secondTab', () => {
    render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText('Detalles')).toBeDefined()
  })

  it('renderiza el nombre del participante', () => {
    render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText(/Juan/)).toBeDefined()
  })

  it('renderiza el rol del participante', () => {
    render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText(/Investigador/)).toBeDefined()
  })

  it('renderiza el RiskGauge con los valores correctos', () => {
    render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText('50%')).toBeDefined()
  })

  it('renderiza con diferentes porcentajes de riesgo', () => {
    const { rerender } = render(<DossierHeader {...defaultProps} />)
    expect(screen.getByText('50%')).toBeDefined()

    rerender(<DossierHeader {...defaultProps} gaugePercent={75} gaugeValueText="75%" />)
    expect(screen.getByText('75%')).toBeDefined()
  })
})
