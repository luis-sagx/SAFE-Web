import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ForwardedCode from './CodigoReenviado'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('CodigoReenviado', () => {
  it('abre en el hilo del impostor, como cualquier otro escenario', () => {
    const phone = start(<ForwardedCode />)

    expect(within(phone).getByText('+593 99 412 8867')).toBeDefined()
    expect(within(phone).getByText(/reenvíeme el código de seis dígitos/)).toBeDefined()
  })

  // El código no puede salir de la nada. Sale del hilo con la flecha ‹, que es
  // el gesto de un teléfono de verdad, y ahí la vista previa del banco lo
  // enseña junto al remitente por el que escribe siempre.
  it('la flecha de la cabecera lleva a la lista, donde está el código del banco', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Volver a la lista de mensajes' }))

    expect(within(phone).getByText(/Su código de verificación es 731 640/)).toBeDefined()
    expect(within(phone).getByText('BANCO LITORAL')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('reenviar el código sale de un solo gesto y se ve mandado en el hilo', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Te reenvío el código.' }))

    expect(within(phone).getByText('Te reenvío el código: 731 640')).toBeDefined()
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('abrir la app del banco no termina la corrida, ni tampoco mirar la seguridad de la cuenta', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))

    expect(within(phone).getByText('Saldo disponible $312,45')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Seguridad de la cuenta/ }))

    // Mirar la seguridad de la cuenta no termina la corrida: el impostor sigue
    // esperando respuesta, así que comprobar solo no basta.
    expect(within(phone).getByText('Ninguno desde otro dispositivo')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    // Salir de la app devuelve al hilo del impostor, ya comprobado: negarse
    // ahora sí cierra el escenario, porque no queda nada pendiente.
    fireEvent.click(within(phone).getByRole('button', { name: 'Salir de la aplicación' }))
    fireEvent.click(within(phone).getByRole('button', { name: /Ese código no se lo puedo pasar/ }))
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  it('negarse sin haber comprobado no es el acierto pleno', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: /Ese código no se lo puedo pasar/ }))

    expect(screen.getByText('No lo diste, pero les seguiste contestando')).toBeDefined()
  })

  it('cambiar la clave sin mirar los accesos no es el acierto', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Cambiar mi clave/ }))

    expect(screen.getByText('Cambiaste la clave, pero el código sigue vivo')).toBeDefined()
  })

  // El código llega solo, como en un teléfono de verdad: no hay que salir del
  // hilo del impostor a buscarlo.
  it('el código del banco llega como notificación desde el primer instante', () => {
    const phone = start(<ForwardedCode />)

    expect(within(phone).getByText('BANCO LITORAL')).toBeDefined()
    expect(within(phone).getByText(/Su codigo de verificacion es 731 640/)).toBeDefined()
  })

  it('tocar la notificación abre el mensaje del banco', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Abrir la notificación' }))

    expect(within(phone).getByText(/Su codigo de verificacion es 731 640/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('descartar la notificación no termina la corrida ni enciende la pista de fallo', () => {
    const phone = start(<ForwardedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Descartar la notificación' }))

    expect(within(phone).queryByText(/Su codigo de verificacion es 731 640/)).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText('Ahí no hay nada que hacer.', { exact: false })).toBeNull()
  })
})
