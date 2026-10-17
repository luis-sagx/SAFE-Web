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
  it.each(['acción visible', 'dock'])('abrir Mi Operadora desde %s espera a que elijas suscripciones', (entry) => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(entry === 'dock'
      ? within(phone).getByRole('button', { name: /Mi Operadora/ })
      : screen.getByRole('button', { name: /Revisar el cobro en Mi Operadora/ }))

    expect(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ })).toBeDefined()
    expect(within(phone).getByRole('button', { name: /Bloquear mensajes de números cortos/ })).toBeDefined()
    expect(screen.queryByText('No caíste · lo comprobaste con tu operadora')).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ }))

    expect(within(phone).getByText('Suscripciones activas')).toBeDefined()
    expect(within(phone).getByText('Ninguna')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste con tu operadora')).toBeDefined()
  })

  it('salir desde una acción visible conserva el resultado parcial', () => {
    start(<SubscriptionCancellation />)

    fireEvent.click(screen.getByRole('button', { name: /Salir del mensaje sin responder/ }))

    expect(screen.getByText('No contestaste, pero quedaste con la duda')).toBeDefined()
  })

  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const phone = start(<SubscriptionCancellation />)

    // El campo está vacío y no es un botón que rellene nada por su cuenta.
    expect(within(phone).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(phone).getByRole('button', { name: 'BAJA' })).toBeDefined()
  })

  it('responder BAJA deja la burbuja enviada en el hilo y cierra en fallo', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(screen.getByRole('button', { name: /Responder BAJA al mensaje/ }))

    // Ya no es una burbuja para elegir: es un mensaje mandado dentro del hilo.
    expect(within(phone).queryByRole('button', { name: 'BAJA' })).toBeNull()
    expect(within(phone).getByText('BAJA')).toBeDefined()
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

  it('bloquear mensajes sin consultar las suscripciones termina en parcial', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))

    fireEvent.click(within(phone).getByRole('button', { name: /Bloquear mensajes de números cortos/ }))

    expect(screen.getByText('Te tapaste el oído, pero no comprobaste nada')).toBeDefined()
    expect(screen.queryByText('No caíste · lo comprobaste con tu operadora')).toBeNull()
  })
})
