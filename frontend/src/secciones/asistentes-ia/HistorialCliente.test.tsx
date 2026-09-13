import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CustomerHistory from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

// Cada burbuja muestra el mensaje entero que se enviaría, así que el nombre de
// accesibilidad del botón es ese texto. Se buscan por un fragmento distintivo.
const BUTTON = {
  // Paso 1
  conDatos: /Sus datos: Mónica Zambrano.*teléfono 099 000 0045\.$/,
  soloMotivo: /No inventes datos de la cuenta\.$/,
  pideSecreto: /No guardes estos datos, son confidenciales\.$/,
  // Paso 2 (tras la oferta de la IA)
  armaCompleta: 'Sí, es Mónica Zambrano, cuenta 2100-0000-45. Déjala lista para enviar.',
  soloNombre: 'Solo el nombre para el saludo: Mónica Zambrano.',
  asiEstaBien: 'Así está bien, el resto lo completo yo al enviarla.',
}

describe('HistorialCliente', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const container = start(<CustomerHistory />)
    expect(within(container).getByText('Hola, ayúdame a responder el reclamo de una clienta.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame qué reclama la clienta/)).toBeDefined()
  })

  it('cada burbuja muestra el mensaje entero que se enviaría', () => {
    const container = start(<CustomerHistory />)
    const button = within(container).getByRole('button', { name: BUTTON.conDatos })
    expect(button.textContent).toContain('2100-0000-45')
    expect(button.textContent).toContain('$2.340,15')
  })

  it('pasar todos los datos de la cuenta es el fallo, y cada dato se señala solo', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.conDatos }))
    expect(screen.getByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
    expect(container.querySelector('[data-signal="dato-saldo"]')?.textContent).toBe('$2.340,15')
    expect(container.querySelector('[data-signal="dato-devuelto"]')?.textContent).toBe(
      'cuyo saldo disponible es de $2.340,15',
    )
  })

  it('pedir que trate los datos como confidenciales no deshace haberlos compartido', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.pideSecreto }))
    expect(screen.getByText('Pedir confidencialidad no deshace haber compartido el dato')).toBeDefined()
  })

  it('el camino limpio abre un segundo paso: la IA da un borrador genérico y ofrece completarlo', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.soloMotivo }))
    expect(within(container).getByText(/te la dejo lista para enviar/)).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.armaCompleta })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.soloNombre })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.asiEstaBien })).toBeDefined()
    // Todavía no terminó: no hay veredicto.
    expect(screen.queryByText(/Te quedaste con el borrador genérico/)).toBeNull()
  })

  it('aceptar la oferta y darle el nombre y la cuenta es un fallo', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.soloMotivo }))
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.armaCompleta }))
    expect(screen.getByText('La oferta de "dejártela lista" te sacó los datos')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
  })

  it('darle solo el nombre para el saludo queda como respuesta incompleta', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.soloMotivo }))
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.soloNombre }))
    expect(screen.getByText('Cediste el nombre a la oferta')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-nombre"]')?.textContent).toBe('Mónica Zambrano')
  })

  it('quedarse con el borrador genérico y rechazar la oferta es el acierto', () => {
    const container = start(<CustomerHistory />)
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.soloMotivo }))
    fireEvent.click(within(container).getByRole('button', { name: BUTTON.asiEstaBien }))
    expect(screen.getByText('Te quedaste con el borrador genérico')).toBeDefined()
  })
})
