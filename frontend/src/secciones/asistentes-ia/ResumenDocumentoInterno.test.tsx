import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import InternalDocumentSummary from './ResumenDocumentoInterno'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function writeAndSend(container: HTMLElement, texto: string) {
  fireEvent.change(within(container).getByLabelText('Escribe tu mensaje'), { target: { value: texto } })
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))
}

describe('ResumenDocumentoInterno', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el campo para escribir', () => {
    const container = start(<InternalDocumentSummary />)
    expect(within(container).getByText('Hola, necesito resumir un informe del trabajo.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame de qué trata el informe/)).toBeDefined()
  })

  it('el bloc de notas con el informe está siempre visible, con las cifras reales', () => {
    start(<InternalDocumentSummary />)
    expect(screen.getByText(/\$340\.000/)).toBeDefined()
    expect(screen.getByText(/15%/)).toBeDefined()
  })

  it('escribir la cifra real de pérdidas es una fuga', async () => {
    const container = start(<InternalDocumentSummary />)
    writeAndSend(container, 'El informe dice que tuvimos pérdidas de $340.000 este trimestre.')
    expect(await screen.findByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('escribir el porcentaje real del recorte es una fuga', async () => {
    const container = start(<InternalDocumentSummary />)
    writeAndSend(container, 'Vamos a recortar el 15% del personal en enero, resúmelo.')
    expect(await screen.findByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('una cifra distinta a la real no cuenta como fuga', async () => {
    const container = start(<InternalDocumentSummary />)
    writeAndSend(container, 'Tuvimos un resultado financiero negativo este trimestre, resúmelo en un párrafo.')
    expect(await screen.findByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })

  it('pedir solo la estructura, sin ninguna cifra real, es el acierto', async () => {
    const container = start(<InternalDocumentSummary />)
    writeAndSend(
      container,
      'Dame un párrafo modelo que mencione el resultado financiero y una decisión de personal, con espacios para completar.',
    )
    expect(await screen.findByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })
})
