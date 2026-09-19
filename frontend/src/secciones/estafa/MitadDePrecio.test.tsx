import { fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import HalfPrice from './MitadDePrecio'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('MitadDePrecio', () => {
  it('conserva el punto de la conversación al abrir otra app y volver a Mensajes', () => {
    const phone = start(<HalfPrice />)

    fireEvent.click(
      within(phone).getByRole('button', { name: '¿Podemos vernos y lo reviso antes de pagar?' }),
    )
    expect(within(phone).getByText(/yo estoy en Santo Domingo/i)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mercado Abierto/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))

    expect(within(phone).getByText(/yo estoy en Santo Domingo/i)).toBeDefined()
  })

  it('la flecha de una app abierta desde el dock vuelve al mismo punto del chat', () => {
    const phone = start(<HalfPrice />)

    fireEvent.click(
      within(phone).getByRole('button', { name: '¿Podemos vernos y lo reviso antes de pagar?' }),
    )
    fireEvent.click(within(phone).getByRole('button', { name: /Mercado Abierto/ }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Salir de la aplicación' }))

    expect(within(phone).getByText(/yo estoy en Santo Domingo/i)).toBeDefined()
  })

  it('una acción dentro de la app sí continúa la historia', () => {
    const phone = start(<HalfPrice />)

    fireEvent.click(
      within(phone).getByRole('button', { name: '¿Podemos vernos y lo reviso antes de pagar?' }),
    )
    fireEvent.click(within(phone).getByRole('button', { name: /Mercado Abierto/ }))
    fireEvent.click(
      within(phone).getByRole('button', { name: /Buscar el mismo modelo en la página/ }),
    )

    expect(within(phone).getByText(/Ningún otro anuncio del mismo modelo baja de \$820/)).toBeDefined()
  })

  it('el dock no cambia la pantalla después de terminar el escenario', () => {
    const phone = start(<HalfPrice />)

    fireEvent.click(
      within(phone).getByRole('button', { name: '¿Podemos vernos y lo reviso antes de pagar?' }),
    )
    fireEvent.click(
      within(phone).getByRole('button', { name: 'Prefiero pagar contra entrega. Si no, lo dejamos.' }),
    )
    fireEvent.click(
      within(phone).getByRole('button', { name: 'Que se lo lleve el otro. Yo no pago sin ver.' }),
    )
    fireEvent.click(within(phone).getByRole('button', { name: /Mercado Abierto/ }))

    expect(within(phone).queryByText('Celular gama alta, nuevo en caja')).toBeNull()
  })
})
