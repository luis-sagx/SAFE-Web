import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CorreoDatosTerceros from './CorreoDatosTerceros'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CorreoDatosTerceros', () => {
  it('muestra el borrador con los datos de Luis antes de decidir', () => {
    const telefono = empezar(<CorreoDatosTerceros />)
    expect(within(telefono).getByText(/Luis Andrango/)).toBeDefined()
    expect(within(telefono).getByText(/1723456789/)).toBeDefined()
  })

  it('enviar el borrador tal cual expone los datos de Luis', () => {
    empezar(<CorreoDatosTerceros />)
    fireEvent.click(screen.getByRole('button', { name: /Enviar el mensaje tal cual/ }))
    expect(screen.getByText('Datos de un compañero compartidos con la IA')).toBeDefined()
  })

  it('quitar los datos antes de enviar es el acierto', () => {
    empezar(<CorreoDatosTerceros />)
    fireEvent.click(screen.getByRole('button', { name: /Quitar el nombre, la cédula y el correo/ }))
    expect(screen.getByText('Redacción mejorada, sin compartir datos de nadie')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    empezar(<CorreoDatosTerceros />)
    fireEvent.click(screen.getByRole('button', { name: /No usar la IA para este correo/ }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
