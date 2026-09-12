import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SubscriptionCancellation from './BajaSuscripcion'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('BajaSuscripcion', () => {
  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const phone = start(<SubscriptionCancellation />)

    // El campo está vacío y no es un botón que rellene nada por su cuenta.
    expect(within(phone).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(phone).getByRole('button', { name: 'BAJA' })).toBeDefined()
    expect(
      within(phone).getByRole('button', { name: /Yo no contraté nada/ }),
    ).toBeDefined()
  })

  // Las dos frases pierden, así que las dos tienen que terminar igual: la
  // burbuja propia en el hilo y el veredicto encima de ella. Un final que se
  // dispara sin enseñar lo que salió del teléfono no enseña nada.
  it.each([
    ['BAJA', 'BAJA'],
    ['Yo no contraté nada, dejen de cobrarme.', /Yo no contraté nada/],
  ])('contestar "%s" deja la burbuja enviada en el hilo y cierra en fallo', (phrase, sent) => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: phrase }))

    // Ya no es una burbuja para elegir: es un mensaje mandado dentro del hilo.
    expect(within(phone).queryByRole('button', { name: phrase })).toBeNull()
    expect(within(phone).getByText(sent)).toBeDefined()
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  // Un reloj clavado en una hora inventada encima de un mensaje de las 07:52
  // delata la pantalla, y contradice al "al levantarte" del enunciado.
  it('el reloj del teléfono va con el hilo, no con una hora fija', () => {
    const phone = start(<SubscriptionCancellation />)
    const clock = () => phone.querySelector('[class*="phoneStatusBar"] span')?.textContent

    expect(clock()).toBe('07:52')

    fireEvent.click(within(phone).getByRole('button', { name: 'BAJA' }))
    expect(clock()).toBe('07:53')
  })

  it('abrir la app de la operadora no termina la corrida, pero mirar las suscripciones sí', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))

    // Abrir deja en el inicio de la app, con su menú, y sin veredicto.
    expect(within(phone).getByText('Línea 09 8 123 4567')).toBeDefined()
    expect(within(phone).getByText('Prepago · Saldo $4,80')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ }))

    // Mirar las suscripciones ya es la comprobación: no queda nada abierto
    // después, así que la corrida termina aquí.
    expect(within(phone).getByText('Suscripciones activas')).toBeDefined()
    expect(within(phone).getByText('Ninguna')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste con tu operadora')).toBeDefined()
  })

  it('bloquear los números cortos sin comprobar el cobro no es el acierto', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))
    fireEvent.click(
      within(phone).getByRole('button', { name: /Bloquear mensajes de números cortos/ }),
    )

    expect(screen.getByText('Te tapaste el oído, pero no comprobaste nada')).toBeDefined()
  })
})
