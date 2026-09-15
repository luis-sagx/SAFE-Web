import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ThirdPartyDataEmail from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

// Toca una palabra sensible del borrador y escribe su reemplazo. Sin tocarla queda el dato real.
function replace(container: HTMLElement, etiqueta: string, nuevo: string) {
  fireEvent.click(within(container).getByRole('button', { name: `Cambiar ${etiqueta}` }))
  const campo = within(container).getByLabelText(`Reemplazar ${etiqueta}`)
  fireEvent.change(campo, { target: { value: nuevo } })
  fireEvent.blur(campo)
}

function send(container: HTMLElement) {
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

const NOMBRE = 'el nombre completo de tu compañera'
const CEDULA = 'la cédula de tu compañera'
const CORREO = 'el correo de tu compañera'

describe('CorreoDatosTerceros', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el borrador con las palabras marcadas', () => {
    const container = start(<ThirdPartyDataEmail />)
    expect(within(container).getByText('Hola, ayúdame a redactar un correo.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame sobre qué asunto es el correo/)).toBeDefined()
    expect(within(container).getByRole('button', { name: `Cambiar ${NOMBRE}` })).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const container = start(<ThirdPartyDataEmail />)
    expect(within(container).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('enviar el borrador sin tocar nada es una fuga: trae el nombre completo y la cédula reales', async () => {
    const container = start(<ThirdPartyDataEmail />)
    send(container)
    expect(await screen.findByText('Datos de tu compañera compartidos con la IA')).toBeDefined()
  })

  it('el repaso de señales resalta el dato real dentro del mensaje que se envió', async () => {
    const container = start(<ThirdPartyDataEmail />)
    send(container)
    expect(await screen.findByText('Datos de tu compañera compartidos con la IA')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        within(container)
          .getByText(/Andrea Cedeño/)
          .closest('[data-signal="dato-nombre"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        within(container)
          .getByText(/1799999990/)
          .closest('[data-signal="dato-cedula"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })

  it('el mensaje que se envió queda visible en el hilo', async () => {
    const container = start(<ThirdPartyDataEmail />)
    send(container)
    expect(await within(container).findByText(/Andrea Cedeño/)).toBeDefined()
  })

  it('reemplazar los tres datos por una cédula inventada y marcadores no cuenta como fuga', async () => {
    const container = start(<ThirdPartyDataEmail />)
    replace(container, NOMBRE, 'mi compañera')
    replace(container, CEDULA, '1234567890')
    replace(container, CORREO, 'correo@ejemplo.com')
    send(container)
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('dejar solo el nombre de pila, sin apellido ni cédula reales, es parcial', async () => {
    const container = start(<ThirdPartyDataEmail />)
    replace(container, NOMBRE, 'Andrea')
    replace(container, CEDULA, '1234567890')
    replace(container, CORREO, 'correo@ejemplo.com')
    send(container)
    expect(await screen.findByText('Quedó algo identificable, aunque no el dato completo')).toBeDefined()
  })

  it('reemplazar los tres datos reales por marcadores es el acierto', async () => {
    const container = start(<ThirdPartyDataEmail />)
    replace(container, NOMBRE, 'una compañera')
    replace(container, CEDULA, 'su cédula')
    replace(container, CORREO, 'su correo')
    send(container)
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })
})
