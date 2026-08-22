import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TarjetaBloqueada from './TarjetaBloqueada'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('TarjetaBloqueada', () => {
  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const telefono = empezar(<TarjetaBloqueada />)

    expect(within(telefono).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(telefono).getByRole('button', { name: /¿Qué consumo fue\?/ })).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /¿Qué consumo fue\?/ }))
    expect(screen.getByText('No entregaste nada, pero contestaste')).toBeDefined()
  })

  it('abrir la app del banco no termina la corrida', () => {
    const telefono = empezar(<TarjetaBloqueada />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco/ }))

    // Abrir deja en el inicio de la banca móvil, con su menú, y sin veredicto.
    expect(within(telefono).getByText('Cupo disponible $1.240,00')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Mis tarjetas/ }))
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  it('anular la tarjeta sin mirar su estado no es el acierto', () => {
    const telefono = empezar(<TarjetaBloqueada />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Bloquear tarjeta/ }))

    expect(screen.getByText('Anulaste una tarjeta que estaba sana')).toBeDefined()
  })
})
