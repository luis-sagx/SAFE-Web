import { fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import AdvancedRent from './ArriendoAnticipado'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('ArriendoAnticipado', () => {
  it('conserva la conversación al consultar el portal y volver a Mensajes', () => {
    const phone = start(<AdvancedRent />)

    fireEvent.click(
      within(phone).getByRole('button', { name: 'Quisiera verlo antes. ¿Cuándo puedo pasar?' }),
    )
    expect(within(phone).getByText(/trabajando en Lago Agrio/i)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Portal Inmobiliario/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))

    expect(within(phone).getByText(/trabajando en Lago Agrio/i)).toBeDefined()
  })
})
