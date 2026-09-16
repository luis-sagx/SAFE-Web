import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CustomerHistory from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function writeAndSend(container: HTMLElement, texto: string) {
  fireEvent.change(within(container).getByLabelText('Escribe tu mensaje'), { target: { value: texto } })
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

// Paso 2 (tras la oferta de la IA): sin cambios, sigue siendo elegir entre burbujas.
const BUTTON = {
  armaCompleta: 'Sí, es Mónica Zambrano, cuenta 2100-0000-45. Déjala lista para enviar.',
  soloNombre: 'Solo el nombre para el saludo: Mónica Zambrano.',
  asiEstaBien: 'Así está bien, el resto lo completo yo al enviarla.',
}

describe('HistorialCliente', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el campo para escribir', () => {
    const container = start(<CustomerHistory />)
    expect(within(container).getByText('Hola, ayúdame a responder el reclamo de una clienta.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame qué reclama la clienta/)).toBeDefined()
  })

  it('la ficha de la clienta está siempre visible, con sus datos reales', () => {
    start(<CustomerHistory />)
    expect(screen.getByText(/2100-0000-45/)).toBeDefined()
  })

  it('pasar todos los datos reales de la cuenta es el fallo', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(
      container,
      'Reclama por qué le cobramos $45 de más. Sus datos: Mónica Zambrano, cuenta 2100-0000-45, saldo $2.340,15, teléfono 099 000 0045.',
    )
    expect(await screen.findByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()
  })

  it('pedir que trate los datos como confidenciales no deshace haberlos compartido', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(
      container,
      'Reclama por qué le cobramos $45 de más. Sus datos: Mónica Zambrano, cuenta 2100-0000-45. No guardes estos datos, son confidenciales.',
    )
    expect(await screen.findByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()
  })

  it('solo el nombre de pila, sin cuenta ni saldo reales, es parcial', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(container, 'Reclama por qué le cobramos $45 de más. Se llama Mónica.')
    expect(await screen.findByText('Quedó algo identificable, aunque no el dato completo')).toBeDefined()
  })

  it('el camino limpio abre un segundo paso: la IA da un borrador genérico y ofrece completarlo', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(
      container,
      'Reclama por qué le cobramos $45 de más este mes. Respóndele formal y amable, sin inventar datos de la cuenta.',
    )
    expect(await within(container).findByText(/te la dejo lista para enviar/)).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.armaCompleta })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.soloNombre })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.asiEstaBien })).toBeDefined()
    // Todavía no terminó: no hay veredicto.
    expect(screen.queryByText(/Te quedaste con el borrador genérico/)).toBeNull()
  })

  it('aceptar la oferta y darle el nombre y la cuenta es un fallo', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(container, 'Reclama por qué le cobramos $45 de más este mes, sin inventar datos.')
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.armaCompleta }))
    expect(screen.getByText('La oferta de "dejártela lista" te sacó los datos')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
  })

  it('darle solo el nombre para el saludo queda como respuesta incompleta', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(container, 'Reclama por qué le cobramos $45 de más este mes, sin inventar datos.')
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.soloNombre }))
    expect(screen.getByText('Cediste el nombre a la oferta')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-nombre"]')?.textContent).toBe('Mónica Zambrano')
  })

  it('quedarse con el borrador genérico y rechazar la oferta es el acierto', async () => {
    const container = start(<CustomerHistory />)
    writeAndSend(container, 'Reclama por qué le cobramos $45 de más este mes, sin inventar datos.')
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.asiEstaBien }))
    expect(screen.getByText('Te quedaste con el borrador genérico')).toBeDefined()
  })
})
