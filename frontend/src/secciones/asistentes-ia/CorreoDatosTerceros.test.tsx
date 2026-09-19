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
    expect(screen.getByText(/Andrea Carolina Cedeño Mora/)).toBeDefined()
    expect(screen.getByText(/Marcelo Alejandro Tapia Vera/)).toBeDefined()
    expect(screen.getByText(/1799999990/)).toBeDefined()
  })

  it('el botón de enviar está deshabilitado mientras el campo está vacío', () => {
    const container = start(<ThirdPartyDataEmail />)
    const boton = within(container).getByRole('button', { name: 'Enviar el mensaje' }) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
  })

  it('escribir tres partes reales del nombre de la compañera es una fuga', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(
      container,
      'Es para pedir un cambio de horario a nombre de Andrea Carolina Cedeño.',
    )
    expect(await screen.findByText('Datos personales compartidos con la IA')).toBeDefined()
  })

  it('dos partes del nombre de la compañera no causan pérdida', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es para pedir un cambio de horario a nombre de Andrea Cedeño.')
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('dos partes del docente son seguras, pero tres son una fuga', async () => {
    const seguro = start(<ThirdPartyDataEmail />)
    writeAndSend(seguro, 'Es para pedirle al Ing. Marcelo Tapia un cambio de horario en Redes.')
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()

    const fuga = start(<ThirdPartyDataEmail />)
    writeAndSend(fuga, 'Es para pedirle a Marcelo Alejandro Tapia un cambio de horario en Redes.')
    expect(await screen.findAllByText('Datos personales compartidos con la IA')).toHaveLength(1)
  })

  it('el repaso de señales resalta el dato real dentro del mensaje que se envió', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es a nombre de Andrea Carolina Cedeño Mora, cédula 1799999990.')
    expect(await screen.findByText('Datos personales compartidos con la IA')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))
    await waitFor(() => {
      expect(
        within(container)
          .getByText(/Andrea Carolina Cedeño Mora/)
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

  it('escribir solo el nombre de pila, sin apellido ni cédula, es seguro', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'Es a nombre de Andrea, para la materia de Redes.')
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('sin nombre, sin cédula y sin correo reales es el acierto', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(
      container,
      'Es para pedir un cambio de horario a nombre de una compañera, en la materia de Redes.',
    )
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('un mensaje sin asunto no aprueba: la IA repregunta y el chat sigue abierto', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'nose')
    expect(await within(container).findByText(/Me falta información para redactarlo/)).toBeDefined()
    expect(screen.queryByText('Correo redactado sin compartir datos reales de nadie')).toBeNull()
    writeAndSend(container, 'Es para pedirle al profesor un cambio de horario en Redes.')
    expect(await screen.findByText('Correo redactado sin compartir datos reales de nadie')).toBeDefined()
  })

  it('tras una repregunta, filtrar el dato real sigue siendo fuga', async () => {
    const container = start(<ThirdPartyDataEmail />)
    writeAndSend(container, 'hola')
    writeAndSend(container, 'Su correo es andrea.cedeno02')
    expect(await screen.findByText('Datos personales compartidos con la IA')).toBeDefined()
  })

})
