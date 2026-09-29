import { fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import WashingMachinePayment from './PagoLavadora'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('PagoLavadora', () => {
  it('conserva el mensaje enviado y la respuesta al volver desde los movimientos a Mensajes', () => {
    const phone = start(<WashingMachinePayment />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Deme un momento, reviso mi banco.' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Ver movimientos/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))

    expect(within(phone).getByText('Deme un momento, reviso mi banco.')).toBeDefined()
    expect(within(phone).getByText(/Claro, revise con calma/)).toBeDefined()
    expect(within(phone).getByRole('button', { name: /Ya vi que entró/ })).toBeDefined()
    expect(within(phone).queryByRole('button', { name: 'Listo, venga cuando quiera.' })).toBeNull()
  })

  it('no inventa un mensaje enviado si se abrió el banco directamente', () => {
    const phone = start(<WashingMachinePayment />)

    fireEvent.click(within(phone).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))

    expect(within(phone).getByRole('button', { name: 'Deme un momento, reviso mi banco.' })).toBeDefined()
    expect(within(phone).queryByText(/Claro, revise con calma/)).toBeNull()
  })
})
