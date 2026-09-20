import { fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ExtraChange from './VueltoDeMas'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('VueltoDeMas', () => {
  it('abrir Mensajes desde una transferencia no abandona el nodo narrativo', () => {
    const phone = start(<ExtraChange />)

    fireEvent.click(within(phone).getByRole('button', { name: /Uy, qué problema/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Voy a transferirle ahorita/ }))
    expect(within(phone).getByText('Confirma la transferencia')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))
    expect(within(phone).getByText(/mándeme los \$1\.170 a esta cuenta/)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))
    expect(within(phone).getByText('Confirma la transferencia')).toBeDefined()
  })
})
