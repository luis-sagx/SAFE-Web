import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SchoolReport from './InformeEscolar'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function writeAndSend(container: HTMLElement, texto: string) {
  fireEvent.change(within(container).getByLabelText('Escribe tu mensaje'), { target: { value: texto } })
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

describe('InformeEscolar', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el campo para escribir', () => {
    const container = start(<SchoolReport />)
    expect(
      within(container).getByText('Hola, ayúdame a mejorar la redacción de un informe de seguimiento de un estudiante.'),
    ).toBeDefined()
    expect(within(container).getByText(/Pégame el contenido que quieres mejorar/)).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const container = start(<SchoolReport />)
    expect(within(container).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('la ficha del estudiante está siempre visible, con sus datos reales', () => {
    start(<SchoolReport />)
    expect(screen.getByText(/1799999965/)).toBeDefined()
  })

  it('pegar la ficha completa (cédula, fecha y domicilio reales) es el fallo', async () => {
    const container = start(<SchoolReport />)
    writeAndSend(
      container,
      'Aquí va: Emilio Torres, cédula 1799999965, fecha de nacimiento 14/06/2015, domicilio Cdla. La Alborada, Mz 14 Villa 7. Seguimiento del segundo parcial.',
    )
    expect(
      await screen.findByText('El informe entero del estudiante quedó en un servicio externo'),
    ).toBeDefined()
  })

  it('el mensaje que se envió queda visible en el hilo', async () => {
    const container = start(<SchoolReport />)
    writeAndSend(container, 'Aquí va: Emilio Torres, cédula 1799999965. Seguimiento del segundo parcial.')
    expect(await within(container).findByText(/1799999965/)).toBeDefined()
  })

  it('dejar solo el teléfono real (sin cédula, fecha ni domicilio) deja la respuesta a medias', async () => {
    const container = start(<SchoolReport />)
    writeAndSend(container, 'Aquí va: Emilio Torres, teléfono de contacto 099 000 0072. Seguimiento del segundo parcial.')
    expect(await screen.findByText('Quitaste lo peor, pero dejaste cómo llegar hasta él')).toBeDefined()
  })

  it('una cédula inventada con la misma forma no cuenta como fuga ni parcial', async () => {
    const container = start(<SchoolReport />)
    writeAndSend(container, 'Aquí va: Emilio Torres, cédula 1234567890. Seguimiento del segundo parcial.')
    expect(await screen.findByText('Informe mejorado sin entregar los datos de nadie')).toBeDefined()
  })

  it('pegar solo el seguimiento académico, sin datos reales, es el acierto', async () => {
    const container = start(<SchoolReport />)
    writeAndSend(
      container,
      'Seguimiento del segundo parcial: mejoró la participación en clase y el trabajo en equipo.',
    )
    expect(await screen.findByText('Informe mejorado sin entregar los datos de nadie')).toBeDefined()
  })
})
