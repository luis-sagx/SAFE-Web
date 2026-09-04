import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import GananciaGarantizada from './GananciaGarantizada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('GananciaGarantizada', () => {
  it('permite cortar la inversión después de comprobar el registro público', () => {
    const telefono = empezar(<GananciaGarantizada />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Sí llegó. ¿Cuánto tendría que poner ahora?' }))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Me interesa. ¿A qué cuenta deposito?' }))
    fireEvent.click(
      within(telefono).getByRole('button', { name: 'Antes quiero ver si la empresa está registrada.' }),
    )
    expect(within(telefono).getByText('Resultado de la búsqueda.')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /No voy a invertir en esto/ }))

    expect(screen.getByText('No caíste · cortaste a tiempo')).toBeDefined()
  })

  it('permite cortar la inversión después de ver la comisión de retiro', () => {
    const telefono = empezar(<GananciaGarantizada />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Ruvel Capital' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Retirar mis fondos/ }))
    expect(within(telefono).getByText('Comisión de liberación')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /No voy a invertir en esto/ }))

    expect(screen.getByText('No caíste · cortaste a tiempo')).toBeDefined()
  })
})
