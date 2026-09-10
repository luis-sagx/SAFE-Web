import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CorreoDatosTerceros from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CorreoDatosTerceros', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    expect(within(pantalla).getByText('Hola, ayúdame a redactar un correo.')).toBeDefined()
    expect(within(pantalla).getByText(/¿Sobre qué asunto es el correo/)).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    expect(within(pantalla).getByText(/Andrea Cedeño, cédula 1798765432/)).toBeDefined()
    expect(within(pantalla).getByText(/Deja en blanco los datos de ella/)).toBeDefined()
  })

  it('enviar los datos tal cual expone el nombre, la cédula y el correo', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /Andrea Cedeño, cédula 1798765432/ }))
    expect(screen.getByText('Datos de una compañera compartidos con la IA')).toBeDefined()
  })

  it('cada dato sensible se señala por separado, no la burbuja entera', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /Andrea Cedeño, cédula 1798765432/ }))
    for (const senal of ['dato-nombre', 'dato-cedula', 'dato-correo']) {
      expect(pantalla.querySelector(`[data-signal="${senal}"]`)).not.toBeNull()
    }
    expect(pantalla.querySelector('[data-signal="dato-cedula"]')?.textContent).toBe('1798765432')
  })

  it('quitar los datos antes de enviar es el acierto', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /Deja en blanco los datos de ella/ }))
    expect(screen.getByText('Correo redactado sin compartir datos de nadie')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const pantalla = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Mejor lo escribo yo, gracias.' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
