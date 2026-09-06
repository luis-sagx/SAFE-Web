import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TrampaUSB from './TrampaUSB'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('TrampaUSB', () => {
  it('abre en el estacionamiento con el USB en el suelo', () => {
    empezar(<TrampaUSB />)

    expect(screen.getByAltText('USB abandonado en el estacionamiento')).toBeDefined()
  })

  it('ofrece las decisiones en la columna de decisión', () => {
    empezar(<TrampaUSB />)

    expect(screen.getByRole('button', { name: /Dejarlo donde está y avisar a IT/ })).toBeDefined()
  })

  it('agarrar el USB es la decisión de riesgo', async () => {
    empezar(<TrampaUSB />)

    fireEvent.click(screen.getByRole('button', { name: /Agarrarlo, alguien lo dejó/ }))

    expect(await screen.findByText('Riesgo detectado')).toBeDefined()
  })

  it('reportar el USB es la decisión segura', async () => {
    empezar(<TrampaUSB />)

    fireEvent.click(screen.getByRole('button', { name: /Dejarlo donde está y avisar a IT/ }))

    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('dejarlo ahí sin reportar queda como decisión parcial', async () => {
    empezar(<TrampaUSB />)
    fireEvent.click(screen.getByRole('button', { name: /Dejarlo ahí, no es asunto tuyo/ }))
    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })
})
