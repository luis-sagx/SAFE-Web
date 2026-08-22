import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CodigoReenviado from './CodigoReenviado'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CodigoReenviado', () => {
  it('abre en el hilo del impostor, como cualquier otro escenario', () => {
    const telefono = empezar(<CodigoReenviado />)

    expect(within(telefono).getByText('+593 99 412 8867')).toBeDefined()
    expect(within(telefono).getByText(/reenvíeme el código de seis dígitos/)).toBeDefined()
  })

  // El código no puede salir de la nada. Sale del hilo con la flecha ‹, que es
  // el gesto de un teléfono de verdad, y ahí la vista previa del banco lo
  // enseña junto al remitente por el que escribe siempre.
  it('la flecha de la cabecera lleva a la lista, donde está el código del banco', () => {
    const telefono = empezar(<CodigoReenviado />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver a la lista de mensajes' }))

    expect(within(telefono).getByText(/Su código de verificación es 731 640/)).toBeDefined()
    expect(within(telefono).getByText('BANCO LITORAL')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('reenviar el código sale de un solo gesto y se ve mandado en el hilo', () => {
    const telefono = empezar(<CodigoReenviado />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Te reenvío el código.' }))

    expect(within(telefono).getByText('Te reenvío el código: 731 640')).toBeDefined()
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('abrir la app del banco no termina la corrida', () => {
    const telefono = empezar(<CodigoReenviado />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco/ }))

    expect(within(telefono).getByText('Saldo disponible $312,45')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Seguridad de la cuenta/ }))
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  it('cambiar la clave sin mirar los accesos no es el acierto', () => {
    const telefono = empezar(<CodigoReenviado />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Cambiar mi clave/ }))

    expect(screen.getByText('Cambiaste la clave, pero el código sigue vivo')).toBeDefined()
  })
})
