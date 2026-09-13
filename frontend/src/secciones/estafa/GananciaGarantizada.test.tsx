import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import GuaranteedProfit from './GananciaGarantizada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('GananciaGarantizada', () => {
  it('permite cortar la inversión después de comprobar el registro público', () => {
    const phone = start(<GuaranteedProfit />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Sí llegó. ¿Cuánto tendría que poner ahora?' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Me interesa. ¿A qué cuenta deposito?' }))
    fireEvent.click(
      within(phone).getByRole('button', { name: 'Antes quiero ver si la empresa está registrada.' }),
    )
    expect(within(phone).getByText('Resultado de la búsqueda.')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /No voy a invertir en esto/ }))

    expect(screen.getByText('No caíste · cortaste a tiempo')).toBeDefined()
  })

  it('permite cortar la inversión después de ver la comisión de retiro', () => {
    const phone = start(<GuaranteedProfit />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Ruvel Capital' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Retirar mis fondos/ }))
    expect(within(phone).getByText('Comisión de liberación')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /No voy a invertir en esto/ }))

    expect(screen.getByText('No caíste · cortaste a tiempo')).toBeDefined()
  })
})
