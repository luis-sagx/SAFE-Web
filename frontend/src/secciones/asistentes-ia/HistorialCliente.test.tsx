import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import HistorialCliente from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

const BOTON = {
  conDatos: 'Le paso el reclamo con los datos de la clienta.',
  soloNombre: 'Le paso el motivo y el nombre de la clienta para el saludo.',
  soloMotivo: 'Le paso solo el motivo del reclamo.',
  pideSecreto: 'Le paso el reclamo y le pido que trate los datos como confidenciales.',
  recae: 'Sí, es Mónica Zambrano, cuenta 2100-0000-45.',
  mantiene: 'No hace falta, eso lo completo yo al enviarla.',
}

describe('HistorialCliente', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<HistorialCliente />)
    expect(within(pantalla).getByText('Hola, ayúdame a responder el reclamo de una clienta.')).toBeDefined()
    expect(within(pantalla).getByText(/Cuéntame qué reclama la clienta/)).toBeDefined()
  })

  it('las burbujas no delatan qué comparte cada camino', () => {
    const pantalla = empezar(<HistorialCliente />)
    expect(within(pantalla).getByRole('button', { name: BOTON.conDatos })).toBeDefined()
    // El número de cuenta no aparece hasta que se envía el mensaje.
    expect(within(pantalla).queryByText(/2100-0000-45/)).toBeNull()
  })

  it('pasar todos los datos de la cuenta es el fallo, y cada dato se señala solo', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.conDatos }))
    expect(screen.getByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
    expect(pantalla.querySelector('[data-signal="dato-saldo"]')?.textContent).toBe('$2.340,15')
    expect(pantalla.querySelector('[data-signal="dato-devuelto"]')?.textContent).toBe(
      'cuyo saldo disponible es de $2.340,15',
    )
  })

  it('dar solo el nombre para el saludo queda como respuesta incompleta', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.soloNombre }))
    expect(screen.getByText('Diste menos, pero diste')).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-nombre"]')?.textContent).toBe('Mónica Zambrano')
  })

  it('pedir que trate los datos como confidenciales no deshace haberlos compartido', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.pideSecreto }))
    expect(screen.getByText('Pedir confidencialidad no deshace haber compartido el dato')).toBeDefined()
  })

  it('el camino limpio abre un segundo paso: la IA repregunta por el nombre y la cuenta', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.soloMotivo }))
    expect(within(pantalla).getByText(/Para personalizar el saludo y el cierre/)).toBeDefined()
    expect(within(pantalla).getByRole('button', { name: BOTON.recae })).toBeDefined()
    expect(within(pantalla).getByRole('button', { name: BOTON.mantiene })).toBeDefined()
    // Todavía no terminó: no hay veredicto.
    expect(screen.queryByText(/Respuesta redactada sin exponer/)).toBeNull()
  })

  it('ceder a la repregunta es un fallo, aunque el primer mensaje fuera limpio', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.soloMotivo }))
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.recae }))
    expect(screen.getByText('Resististe al principio, cediste a la segunda')).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
  })

  it('mantener la respuesta solo con el motivo, también en el segundo paso, es el acierto', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.soloMotivo }))
    fireEvent.click(within(pantalla).getByRole('button', { name: BOTON.mantiene }))
    expect(screen.getByText('Respuesta redactada sin exponer los datos de la clienta')).toBeDefined()
  })
})
