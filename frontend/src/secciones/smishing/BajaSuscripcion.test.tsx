import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import { formatTime } from '../../hooks/useRelojDelSistema'
import SubscriptionCancellation from './BajaSuscripcion'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('BajaSuscripcion', () => {
  it('abrir Mi Operadora desde el dock espera a que elijas suscripciones', () => {
    const phone = start(<SubscriptionCancellation />)
    const help = screen.getByText('No sé por dónde empezar').closest('details') as HTMLDetailsElement

    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(help.open).toBe(false)
    fireEvent.click(screen.getByText('No sé por dónde empezar'))
    expect(help.open).toBe(true)
    expect(within(help).getByRole('button', { name: /Revisar el cobro en Mi Operadora/ })).toBeDefined()
    expect(within(help).getByRole('button', { name: /Responder BAJA al mensaje/ })).toBeDefined()
    expect(within(help).getByRole('button', { name: /Salir del mensaje sin responder/ })).toBeDefined()
    fireEvent.click(screen.getByText('No sé por dónde empezar'))
    expect(help.open).toBe(false)

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))

    expect(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ })).toBeDefined()
    expect(within(phone).getByText('Recargas de saldo')).toBeDefined()
    expect(screen.queryByText('No caíste · lo comprobaste con tu operadora')).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Salir de la aplicación' }))
    expect(within(phone).getByRole('region', { name: 'Mensajes de texto' })).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))

    fireEvent.click(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ }))

    expect(within(phone).getByText('Suscripciones activas')).toBeDefined()
    expect(within(phone).getByText('Ninguna')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste con tu operadora')).toBeDefined()
  })

  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const phone = start(<SubscriptionCancellation />)

    // El campo está vacío y no es un botón que rellene nada por su cuenta.
    expect(within(phone).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(phone).getByRole('button', { name: 'BAJA' })).toBeDefined()
  })

  it('responder BAJA deja la burbuja enviada en el hilo y cierra en fallo', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: 'BAJA' }))

    // Ya no es una burbuja para elegir: es un mensaje mandado dentro del hilo.
    expect(within(phone).queryByRole('button', { name: 'BAJA' })).toBeNull()
    expect(within(phone).getByText('BAJA')).toBeDefined()
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('el reloj del teléfono muestra la hora local actual, independiente del hilo', () => {
    const phone = start(<SubscriptionCancellation />)
    const clock = () => phone.querySelector('[class*="phoneStatusBar"] span')?.textContent

    expect(clock()).toBe(formatTime(new Date()))

    fireEvent.click(within(phone).getByRole('button', { name: 'BAJA' }))
    expect(clock()).toBe(formatTime(new Date()))
  })

  it('tocar la fila de recargas mantiene abierta la app sin pedir ayuda', () => {
    const phone = start(<SubscriptionCancellation />)

    fireEvent.click(within(phone).getByRole('button', { name: /Mi Operadora/ }))

    fireEvent.click(within(phone).getByText('Recargas de saldo'))

    expect(within(phone).getByText('Consulta tus recargas recientes')).toBeDefined()
    expect(within(phone).queryByRole('button', { name: /Recargas de saldo/ })).toBeNull()
    expect(within(phone).getByRole('button', { name: /Paquetes y suscripciones/ })).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText(/Aquí no hay nada que hacer/)).toBeNull()
  })
})
