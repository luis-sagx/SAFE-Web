import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TrampaUSB from './TrampaUSB'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('TrampaUSB', () => {
  it('abre en el estacionamiento con el USB en el suelo', () => {
    const telefono = empezar(<TrampaUSB />)

    expect(within(telefono).getByText('Estacionamiento')).toBeDefined()
  })

  it('la pista explica dónde tocar sin revelar la respuesta', () => {
    empezar(<TrampaUSB />)

    fireEvent.click(screen.getByText(/No sé por dónde empezar/))

    expect(screen.getByText(/Haz click en el USB/)).toBeDefined()
  })

  it('agarrar el USB es la decisión de riesgo', async () => {
    const telefono = empezar(<TrampaUSB />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Agarrarlo, alguien lo dejó/ }))

    expect(await screen.findByText('Observación')).toBeDefined()
  })

  it('dejar el USB en el suelo es la decisión segura', async () => {
    const telefono = empezar(<TrampaUSB />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Dejarlo ahí/ }))

    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('explica cuándo termina el escenario', () => {
    empezar(<TrampaUSB />)

    fireEvent.click(screen.getByText('¿Cuándo termina el escenario?'))

    expect(screen.getByText(/agarrarlo o dejarlo donde está/)).toBeDefined()
  })
})
