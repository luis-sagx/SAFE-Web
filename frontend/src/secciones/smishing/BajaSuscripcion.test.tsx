import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import BajaSuscripcion from './BajaSuscripcion'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('BajaSuscripcion', () => {
  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const telefono = empezar(<BajaSuscripcion />)

    // El campo está vacío y no es un botón que rellene nada por su cuenta.
    expect(within(telefono).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(telefono).getByRole('button', { name: 'BAJA' })).toBeDefined()
    expect(
      within(telefono).getByRole('button', { name: /Yo no contraté nada/ }),
    ).toBeDefined()
  })

  // Las dos frases pierden, así que las dos tienen que terminar igual: la
  // burbuja propia en el hilo y el veredicto encima de ella. Un final que se
  // dispara sin enseñar lo que salió del teléfono no enseña nada.
  it.each([
    ['BAJA', 'BAJA'],
    ['Yo no contraté nada, dejen de cobrarme.', /Yo no contraté nada/],
  ])('contestar "%s" deja la burbuja enviada en el hilo y cierra en fallo', (frase, enviado) => {
    const telefono = empezar(<BajaSuscripcion />)

    fireEvent.click(within(telefono).getByRole('button', { name: frase }))

    // Ya no es una burbuja para elegir: es un mensaje mandado dentro del hilo.
    expect(within(telefono).queryByRole('button', { name: frase })).toBeNull()
    expect(within(telefono).getByText(enviado)).toBeDefined()
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('abrir la app de la operadora no termina la corrida', () => {
    const telefono = empezar(<BajaSuscripcion />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Mi Operadora/ }))

    // Abrir deja en el inicio de la app, con su menú, y sin veredicto.
    expect(within(telefono).getByText('Línea 09 8 123 4567')).toBeDefined()
    expect(within(telefono).getByText('Prepago · Saldo $4,80')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Paquetes y suscripciones/ }))
    expect(screen.getByText('No caíste · lo comprobaste con tu operadora')).toBeDefined()
  })

  it('bloquear los números cortos sin comprobar el cobro no es el acierto', () => {
    const telefono = empezar(<BajaSuscripcion />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Mi Operadora/ }))
    fireEvent.click(
      within(telefono).getByRole('button', { name: /Bloquear mensajes de números cortos/ }),
    )

    expect(screen.getByText('Te tapaste el oído, pero no comprobaste nada')).toBeDefined()
  })
})
