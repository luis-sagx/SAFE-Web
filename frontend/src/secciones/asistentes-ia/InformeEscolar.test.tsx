import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SchoolReport from './InformeEscolar'

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

const CEDULA = 'la cédula real del estudiante'
const NACIMIENTO = 'la fecha de nacimiento real del estudiante'
const DOMICILIO = 'el domicilio real del estudiante'
const TELEFONO = 'el teléfono real de contacto del estudiante'

describe('InformeEscolar', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el borrador con los datos marcados', () => {
    const container = start(<SchoolReport />)
    expect(
      within(container).getByText('Hola, ayúdame a mejorar la redacción de un informe de seguimiento de un estudiante.'),
    ).toBeDefined()
    expect(within(container).getByText(/Pégame el contenido que quieres mejorar/)).toBeDefined()
    expect(within(container).getByRole('button', { name: `Cambiar ${CEDULA}` })).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const container = start(<SchoolReport />)
    expect(within(container).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('enviar el borrador sin tocar nada es el fallo: trae la cédula, la fecha y el domicilio reales', async () => {
    const container = start(<SchoolReport />)
    send(container)
    expect(
      await screen.findByText('El informe entero del estudiante quedó en un servicio externo'),
    ).toBeDefined()
  })

  it('el mensaje que se envió queda visible en el hilo', async () => {
    const container = start(<SchoolReport />)
    send(container)
    expect(await within(container).findByText(/1799999965/)).toBeDefined()
  })

  it('dejar solo el teléfono real (cambiando cédula, fecha y domicilio) deja la respuesta a medias', async () => {
    const container = start(<SchoolReport />)
    replace(container, CEDULA, 'su cédula')
    replace(container, NACIMIENTO, 'su fecha de nacimiento')
    replace(container, DOMICILIO, 'su domicilio')
    send(container)
    expect(await screen.findByText('Quitaste lo peor, pero dejaste cómo llegar hasta él')).toBeDefined()

    // El repaso de señales resalta el teléfono real dentro del mensaje enviado.
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))
    await waitFor(() => {
      expect(
        within(container)
          .getByText(/099 000 0072/)
          .closest('[data-signal="dato-telefono"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })

  it('reemplazar la cédula por una inventada con la misma forma, junto con el resto, no cuenta como fuga ni parcial', async () => {
    const container = start(<SchoolReport />)
    replace(container, CEDULA, '1234567890')
    replace(container, NACIMIENTO, 'su fecha de nacimiento')
    replace(container, DOMICILIO, 'su domicilio')
    replace(container, TELEFONO, 'su teléfono')
    send(container)
    expect(await screen.findByText('Informe mejorado sin entregar los datos de nadie')).toBeDefined()
  })

  it('reemplazar los cuatro datos reales por marcadores es el acierto', async () => {
    const container = start(<SchoolReport />)
    replace(container, CEDULA, 'su cédula')
    replace(container, NACIMIENTO, 'su fecha de nacimiento')
    replace(container, DOMICILIO, 'su domicilio')
    replace(container, TELEFONO, 'su teléfono')
    send(container)
    expect(await screen.findByText('Informe mejorado sin entregar los datos de nadie')).toBeDefined()
  })
})
