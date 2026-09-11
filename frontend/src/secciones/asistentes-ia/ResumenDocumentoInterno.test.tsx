import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import ResumenDocumentoInterno from './ResumenDocumentoInterno'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('ResumenDocumentoInterno', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    expect(within(pantalla).getByText('Hola, necesito resumir un informe del trabajo.')).toBeDefined()
    expect(within(pantalla).getByText(/Cuéntame de qué trata el informe/)).toBeDefined()
  })

  it('las burbujas no delatan qué comparte cada camino', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    // El botón dice qué haces, no que el informe trae las cifras sin publicar.
    expect(within(pantalla).getByRole('button', { name: 'Le paso el informe y le pido que lo resuma.' })).toBeDefined()
    expect(within(pantalla).queryByText(/\$340\.000/)).toBeNull()
  })

  it('pasar el informe filtra información confidencial, y el mensaje enviado la muestra', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Le paso el informe y le pido que lo resuma.' }))
    expect(screen.getByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-perdidas"]')?.textContent).toBe('$340.000')
    for (const senal of ['dato-recorte', 'dato-sin-avisar']) {
      expect(pantalla.querySelector(`[data-signal="${senal}"]`)).not.toBeNull()
    }
  })

  it('pedir solo el párrafo modelo, sin las cifras, es el acierto', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(
      within(pantalla).getByRole('button', { name: 'Le pido un párrafo modelo y yo pongo las cifras aparte.' }),
    )
    expect(screen.getByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Mejor lo resumo yo, gracias.' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
