import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import HistorialCliente from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('HistorialCliente', () => {
  it('el chat arranca con un saludo, no con los datos de la cuenta ya mandados', () => {
    const telefono = empezar(<HistorialCliente />)
    expect(within(telefono).getByText('Hola, ¿en qué puedo ayudarte?')).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const telefono = empezar(<HistorialCliente />)
    expect(within(telefono).getAllByText(/0102345678/).length).toBeGreaterThan(0)
    expect(within(telefono).getAllByText(/099 456 7890/).length).toBeGreaterThan(0)
  })

  it('pegar todos los datos de la cuenta es el fallo', () => {
    const telefono = empezar(<HistorialCliente />)
    fireEvent.click(
      within(telefono).getByRole('button', {
        name: /^Ayúdame a responder este correo\. Datos de la cuenta.*se le cobró \$45 de más este mes\.$/,
      }),
    )
    expect(screen.getByText('Datos financieros de un cliente compartidos con la IA')).toBeDefined()
  })

  it('pedir la respuesta solo con el motivo del reclamo es el acierto', () => {
    const telefono = empezar(<HistorialCliente />)
    fireEvent.click(within(telefono).getByRole('button', { name: /sin inventar datos de la cuenta/ }))
    expect(screen.getByText('Respuesta redactada sin exponer los datos del cliente')).toBeDefined()
  })

  it('pedirle a la IA que no use los datos no deshace haberlos compartido', () => {
    const telefono = empezar(<HistorialCliente />)
    fireEvent.click(within(telefono).getByRole('button', { name: /son confidenciales/ }))
    expect(screen.getByText('Pedir confidencialidad no deshace haber compartido el dato')).toBeDefined()
  })
})
