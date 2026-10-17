import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import TrafficCitation from './CitacionTransito'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('TrafficCitation', () => {
  it('permite leer y elegir la pregunta antes de enviarla', () => {
    const phone = start(<TrafficCitation />)

    expect(Boolean(within(phone).queryByRole('button', { name: 'Mensaje de texto' }))).toBe(false)
    fireEvent.click(within(phone).getByText('Mensaje de texto'))
    expect(within(phone).queryByText(/Para consultar debe ingresar placa y cédula/)).toBeNull()
    fireEvent.click(within(phone).getByRole('button', { name: '¿Cuál es la placa?' }))

    expect(within(phone).queryByRole('button', { name: '¿Cuál es la placa?' })).toBeNull()
    expect(within(phone).getByText('¿Cuál es la placa?')).toBeDefined()
    expect(within(phone).getByText(/Para consultar debe ingresar placa y cédula/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })
})
