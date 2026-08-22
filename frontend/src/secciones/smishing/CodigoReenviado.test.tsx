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
  it('abre en la lista, con las dos conversaciones y el código a la vista', () => {
    const telefono = empezar(<CodigoReenviado />)

    // El código no sale de la nada: la vista previa del banco lo enseña antes
    // de tocar nada, y los dos remitentes quedan uno debajo del otro.
    expect(within(telefono).getByText(/Su código de verificación es 731 640/)).toBeDefined()
    expect(within(telefono).getByText('BANCO LITORAL')).toBeDefined()
    expect(within(telefono).getByText('+593 99 412 8867')).toBeDefined()
  })

  it('reenviar el código pasa por el campo antes de salir', () => {
    const telefono = empezar(<CodigoReenviado />)

    fireEvent.click(within(telefono).getByRole('button', { name: /\+593 99 412 8867/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Te reenvío el código.' }))

    // Los seis dígitos quedan escritos y todavía sin enviar.
    expect(within(telefono).getByText('Te reenvío el código: 731 640')).toBeDefined()
    expect(screen.queryByText('Caíste en la trampa')).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Enviar el mensaje' }))
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
