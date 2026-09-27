import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ScheduledDelivery from './EntregaProgramada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('EntregaProgramada', () => {
  it('deja tres opciones y aplica los acentos del courier y del banco', () => {
    const phone = start(<ScheduledDelivery />)

    fireEvent.click(within(phone).getByRole('button', { name: /EnvíaExpress/ }))
    expect(phone.querySelectorAll('[class*="opciones"] li')).toHaveLength(3)
    expect(within(phone).queryByRole('button', { name: /Mis direcciones/ })).toBeNull()
    expect((phone.querySelector('[class*="phoneAppBar"]') as HTMLElement).style.backgroundColor).toBe('rgb(194, 65, 12)')

    const bank = within(phone).getByRole('button', { name: /Banco/ })
    expect((bank.querySelector('[class*="phoneDockIcono"]') as HTMLElement).style.background).toBe('rgb(15, 118, 110)')
    fireEvent.click(bank)
    expect((phone.querySelector('[class*="phoneAppBar"]') as HTMLElement).style.backgroundColor).toBe('rgb(15, 118, 110)')
  })

  it('muestra la respuesta predeterminada como opción, sin activar el input', () => {
    const phone = start(<ScheduledDelivery />)

    expect(within(phone).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    fireEvent.click(
      within(phone).getByRole('button', {
        name: '¿A qué hora exactamente? No voy a estar en la mañana.',
      }),
    )

    expect(screen.getByText('Contestaste a un número que no lee')).toBeDefined()
  })
})
