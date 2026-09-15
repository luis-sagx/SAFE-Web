import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CustomerHistory from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function replace(container: HTMLElement, etiqueta: string, nuevo: string) {
  fireEvent.click(within(container).getByRole('button', { name: `Cambiar ${etiqueta}` }))
  const campo = within(container).getByLabelText(`Reemplazar ${etiqueta}`)
  fireEvent.change(campo, { target: { value: nuevo } })
  fireEvent.blur(campo)
}

function send(container: HTMLElement) {
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

const NOMBRE = 'el nombre completo de la clienta'
const CUENTA = 'el número de cuenta real de la clienta'
const SALDO = 'el saldo real de la clienta'
const TELEFONO = 'el teléfono real de la clienta'

// Paso 2 (tras la oferta de la IA): sin cambios, sigue siendo elegir entre burbujas.
const BUTTON = {
  armaCompleta: 'Sí, es Mónica Zambrano, cuenta 2100-0000-45. Déjala lista para enviar.',
  soloNombre: 'Solo el nombre para el saludo: Mónica Zambrano.',
  asiEstaBien: 'Así está bien, el resto lo completo yo al enviarla.',
}

// Reemplaza los cuatro datos reales del borrador del paso 1 por marcadores y lo envía —el camino que abre
// el paso 2, donde la IA ofrece completar el borrador genérico a cambio del nombre y la cuenta.
function sendWithoutData(container: HTMLElement) {
  replace(container, NOMBRE, 'la clienta')
  replace(container, CUENTA, 'su cuenta')
  replace(container, SALDO, 'su saldo')
  replace(container, TELEFONO, 'su teléfono')
  send(container)
}

describe('HistorialCliente', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el borrador con los datos marcados', () => {
    const container = start(<CustomerHistory />)
    expect(within(container).getByText('Hola, ayúdame a responder el reclamo de una clienta.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame qué reclama la clienta/)).toBeDefined()
    expect(within(container).getByRole('button', { name: `Cambiar ${NOMBRE}` })).toBeDefined()
  })

  it('enviar el borrador sin tocar nada es el fallo: trae los cuatro datos reales de la cuenta', async () => {
    const container = start(<CustomerHistory />)
    send(container)
    expect(await screen.findByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()

    // El repaso de señales resalta cada dato real dentro del mensaje enviado.
    // Primera señal: el nombre. La segunda (Siguiente →) es la cuenta.
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))
    await waitFor(() => {
      expect(
        within(container)
          .getByText(/Mónica Zambrano/)
          .closest('[data-signal="dato-nombre"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    await waitFor(() => {
      expect(
        within(container)
          .getByText(/2100-0000-45/)
          .closest('[data-signal="dato-cuenta"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })

  it('solo el nombre de pila, sin cuenta, saldo ni teléfono reales, es parcial', async () => {
    const container = start(<CustomerHistory />)
    replace(container, NOMBRE, 'Mónica')
    replace(container, CUENTA, 'su cuenta')
    replace(container, SALDO, 'su saldo')
    replace(container, TELEFONO, 'su teléfono')
    send(container)
    expect(await screen.findByText('Quedó algo identificable, aunque no el dato completo')).toBeDefined()
  })

  it('el camino limpio abre un segundo paso: la IA da un borrador genérico y ofrece completarlo', async () => {
    const container = start(<CustomerHistory />)
    sendWithoutData(container)
    expect(await within(container).findByText(/te la dejo lista para enviar/)).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.armaCompleta })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.soloNombre })).toBeDefined()
    expect(within(container).getByRole('button', { name: BUTTON.asiEstaBien })).toBeDefined()
    // Todavía no terminó: no hay veredicto.
    expect(screen.queryByText(/Te quedaste con el borrador genérico/)).toBeNull()
  })

  it('aceptar la oferta y darle el nombre y la cuenta es un fallo', async () => {
    const container = start(<CustomerHistory />)
    sendWithoutData(container)
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.armaCompleta }))
    expect(screen.getByText('La oferta de "dejártela lista" te sacó los datos')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
  })

  it('darle solo el nombre para el saludo queda como respuesta incompleta', async () => {
    const container = start(<CustomerHistory />)
    sendWithoutData(container)
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.soloNombre }))
    expect(screen.getByText('Cediste el nombre a la oferta')).toBeDefined()
    expect(container.querySelector('[data-signal="dato-nombre"]')?.textContent).toBe('Mónica Zambrano')
  })

  it('quedarse con el borrador genérico y rechazar la oferta es el acierto', async () => {
    const container = start(<CustomerHistory />)
    sendWithoutData(container)
    fireEvent.click(await within(container).findByRole('button', { name: BUTTON.asiEstaBien }))
    expect(screen.getByText('Te quedaste con el borrador genérico')).toBeDefined()
  })
})
