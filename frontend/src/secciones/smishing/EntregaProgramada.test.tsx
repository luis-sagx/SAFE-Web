import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ScheduledDelivery from './EntregaProgramada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('EntregaProgramada', () => {
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
