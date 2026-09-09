import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CorreoDatosTerceros from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CorreoDatosTerceros', () => {
  it('el chat arranca con un saludo, no con el mensaje ya mandado', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    expect(within(telefono).getByText('Hola, ¿en qué puedo ayudarte?')).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    expect(within(telefono).getByText(/Luis Andrango, con cédula 1723456789/)).toBeDefined()
    expect(within(telefono).getByText(/\[nombre del compañero\]/)).toBeDefined()
  })

  it('enviar el borrador tal cual expone los datos de Luis', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(telefono).getByRole('button', { name: /Luis Andrango, con cédula 1723456789/ }))
    expect(screen.getByText('Datos de un compañero compartidos con la IA')).toBeDefined()
  })

  it('quitar los datos antes de enviar es el acierto', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(telefono).getByRole('button', { name: /\[nombre del compañero\]/ }))
    expect(screen.getByText('Redacción mejorada, sin compartir datos de nadie')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    fireEvent.click(within(telefono).getByRole('button', { name: 'Mejor lo redacto yo mismo, gracias' }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
