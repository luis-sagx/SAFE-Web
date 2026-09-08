import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import EntregaProgramada from './EntregaProgramada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('EntregaProgramada', () => {
  it('muestra la respuesta predeterminada como opción, sin activar el input', () => {
    const telefono = empezar(<EntregaProgramada />)

    expect(within(telefono).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    fireEvent.click(
      within(telefono).getByRole('button', {
        name: '¿A qué hora exactamente? No voy a estar en la mañana.',
      }),
    )

    expect(screen.getByText('Contestaste a un número que no lee')).toBeDefined()
  })
})
