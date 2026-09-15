import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import InternalDocumentSummary from './ResumenDocumentoInterno'

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

const PERDIDAS = 'la cifra real de pérdidas ($340.000)'
const RECORTE = 'el porcentaje real del recorte de personal (15%)'

describe('ResumenDocumentoInterno', () => {
  it('el chat alterna: contesta la IA, y recién entonces se ve el borrador con las cifras marcadas', () => {
    const container = start(<InternalDocumentSummary />)
    expect(within(container).getByText('Hola, necesito resumir un informe del trabajo.')).toBeDefined()
    expect(within(container).getByText(/Cuéntame de qué trata el informe/)).toBeDefined()
    expect(within(container).getByRole('button', { name: `Cambiar ${PERDIDAS}` })).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const container = start(<InternalDocumentSummary />)
    expect(within(container).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('enviar el borrador sin tocar nada es una fuga: trae las dos cifras reales', async () => {
    const container = start(<InternalDocumentSummary />)
    send(container)
    expect(await screen.findByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('dejar el porcentaje real del recorte, aunque se cambie la cifra de pérdidas, es una fuga', async () => {
    const container = start(<InternalDocumentSummary />)
    replace(container, PERDIDAS, 'una cifra sin publicar')
    send(container)
    expect(await screen.findByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('reemplazar las dos cifras por una cifra distinta a la real no cuenta como fuga', async () => {
    const container = start(<InternalDocumentSummary />)
    replace(container, PERDIDAS, 'un monto sin publicar')
    replace(container, RECORTE, 'un porcentaje sin anunciar')
    send(container)
    expect(await screen.findByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })
})
