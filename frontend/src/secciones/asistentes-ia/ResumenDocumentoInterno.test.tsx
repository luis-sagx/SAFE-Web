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
    expect(within(pantalla).getByText(/Cuénteme de qué trata el informe/)).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    expect(within(pantalla).getByText(/\$340\.000/)).toBeDefined()
    expect(within(pantalla).getByText(/15% del personal/)).toBeDefined()
  })

  it('pegar el fragmento completo filtra información confidencial', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /\$340\.000/ }))
    expect(screen.getByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
    for (const senal of ['dato-perdidas', 'dato-recorte', 'dato-sin-avisar']) {
      expect(pantalla.querySelector(`[data-signal="${senal}"]`)).not.toBeNull()
    }
  })

  it('pedir solo el párrafo modelo, sin las cifras, es el acierto', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /con espacios en blanco que yo lleno/ }))
    expect(screen.getByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const pantalla = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Mejor lo resumo yo, gracias.' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
