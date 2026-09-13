import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import UsbTrap from './TrampaUSB'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function triggerFlash() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('TrampaUSB', () => {
  it('abre en el estacionamiento con el USB en el suelo', () => {
    start(<UsbTrap />)

    expect(screen.getByAltText('USB abandonado en el estacionamiento')).toBeDefined()
  })

  it('las opciones no aparecen hasta tocar el destello', () => {
    start(<UsbTrap />)

    expect(screen.queryByRole('button', { name: /Dejarlo donde está y avisar a IT/ })).toBeNull()

    triggerFlash()

    expect(screen.getByRole('button', { name: /Dejarlo donde está y avisar a IT/ })).toBeDefined()
  })

  it('agarrar el USB es la decisión de riesgo', async () => {
    start(<UsbTrap />)
    triggerFlash()

    fireEvent.click(screen.getByRole('button', { name: /Agarrarlo, alguien lo dejó/ }))

    expect(await screen.findByText('Riesgo detectado')).toBeDefined()
  })

  it('reportar el USB es la decisión segura', async () => {
    start(<UsbTrap />)
    triggerFlash()

    fireEvent.click(screen.getByRole('button', { name: /Dejarlo donde está y avisar a IT/ }))

    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('dejarlo ahí sin reportar queda como decisión parcial', async () => {
    start(<UsbTrap />)
    triggerFlash()

    fireEvent.click(screen.getByRole('button', { name: /Dejarlo ahí, no es asunto tuyo/ }))

    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })
})
