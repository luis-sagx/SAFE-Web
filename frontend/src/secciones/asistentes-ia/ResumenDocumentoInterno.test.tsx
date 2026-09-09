import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import ResumenDocumentoInterno from './ResumenDocumentoInterno'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('ResumenDocumentoInterno', () => {
  it('el chat arranca con un saludo, no con las cifras ya mandadas', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    expect(within(telefono).getByText('Hola, ¿en qué puedo ayudarte?')).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    expect(within(telefono).getByText(/\$340\.000/)).toBeDefined()
    expect(within(telefono).getByText(/15% del personal/)).toBeDefined()
  })

  it('pegar el fragmento completo filtra información confidencial', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(telefono).getByRole('button', { name: /\$340\.000/ }))
    expect(screen.getByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('pedir solo la estructura, sin las cifras, es el acierto', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(telefono).getByRole('button', { name: /sin que yo te dé las cifras todavía/ }))
    expect(screen.getByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    fireEvent.click(within(telefono).getByRole('button', { name: 'Mejor lo redacto yo mismo, gracias' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
