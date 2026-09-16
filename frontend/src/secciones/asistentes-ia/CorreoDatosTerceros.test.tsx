import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ThirdPartyDataEmail from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function writeAndSend(container: HTMLElement, texto: string) {
  fireEvent.change(within(container).getByLabelText('Escribe tu mensaje'), { target: { value: texto } })
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

describe('CorreoDatosTerceros', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el campo para escribir', () => {
    const container = start(<ThirdPartyDataEmail />)
    expect(within(container).getByText('Hola, ayúdame a redactar un correo.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame sobre qué asunto es el correo/)).toBeDefined()
    expect(within(container).getByLabelText('Escribe tu mensaje')).toBeDefined()
  })

  it('el bloc de notas con el mensaje de la compañera está siempre visible, con sus datos reales', () => {
    start(<ThirdPartyDataEmail />)
    expect(screen.getByText(/Andrea Cedeño/)).toBeDefined()
    expect(screen.getByText(/1799999990/)).toBeDefined()
  })

  it('el botón de enviar está deshabilitado mientras el campo está vacío', () => {
    const container = start(<ThirdPartyDataEmail />)
    const boton = within(container).getByRole('button', { name: 'Enviar el mensaje' }) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
  })

  it('escribir el nombre completo y la cédula reales es una fuga', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(
      container,
      'Es para pedir un cambio de horario a nombre de Andrea Cedeño, cédula 1799999990.',
    )
    expect(await screen.findByText('Datos de tu compañera compartidos con la IA')).toBeDefined()
  })

  it('el mensaje que se envió queda visible en el hilo', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es para pedir un cambio de horario a nombre de Andrea Cedeño.')
    expect(await within(container).findByText(/Andrea Cedeño/)).toBeDefined()
  })

  it('el repaso de señales resalta el dato real dentro del mensaje que se envió', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es a nombre de Andrea Cedeño, cédula 1799999990.')
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
  })

  it('una cédula inventada con la misma forma no cuenta como fuga', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'A nombre de mi compañera, cédula 1234567890, materia de Redes.')
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('escribir solo el nombre de pila, sin el apellido ni la cédula, es parcial', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es a nombre de Andrea, para la materia de Redes.')
    expect(await screen.findByText('Quedó algo identificable, aunque no el dato completo')).toBeDefined()
  })

  it('sin nombre, sin cédula y sin correo reales es el acierto', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(
      container,
      'Es para pedir un cambio de horario a nombre de una compañera, en la materia de Redes.',
    )
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })
})
