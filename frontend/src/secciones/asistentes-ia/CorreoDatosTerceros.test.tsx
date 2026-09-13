import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ThirdPartyDataEmail from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('CorreoDatosTerceros', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const container = start(<ThirdPartyDataEmail />)
    expect(within(container).getByText('Hola, ayúdame a redactar un correo.')).toBeDefined()
    expect(within(container).getByText(/¿Sobre qué asunto es el correo/)).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const container = start(<ThirdPartyDataEmail />)
    expect(within(container).getByText(/Andrea Cedeño, cédula 1799999990/)).toBeDefined()
    expect(within(container).getByText(/Deja en blanco los datos de ella/)).toBeDefined()
  })

  it('enviar los datos tal cual expone el nombre, la cédula y el correo', () => {
    const container = start(<ThirdPartyDataEmail />)
    fireEvent.click(within(container).getByRole('button', { name: /Andrea Cedeño, cédula 1799999990/ }))
    expect(screen.getByText('Datos de una compañera compartidos con la IA')).toBeDefined()
  })

  it('cada dato sensible se señala por separado, no la burbuja entera', () => {
    const container = start(<ThirdPartyDataEmail />)
    fireEvent.click(within(container).getByRole('button', { name: /Andrea Cedeño, cédula 1799999990/ }))
    for (const signal of ['dato-docente', 'dato-nombre', 'dato-cedula', 'dato-correo']) {
      expect(container.querySelector(`[data-signal="${signal}"]`)).not.toBeNull()
    }
    expect(container.querySelector('[data-signal="dato-cedula"]')?.textContent).toBe('1799999990')
  })

  it('quitar los datos antes de enviar es el acierto', () => {
    const container = start(<ThirdPartyDataEmail />)
    fireEvent.click(within(container).getByRole('button', { name: /Deja en blanco los datos de ella/ }))
    expect(screen.getByText('Correo redactado sin compartir datos de nadie')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const container = start(<ThirdPartyDataEmail />)
    fireEvent.click(within(container).getByRole('button', { name: 'Mejor lo escribo yo, gracias.' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
