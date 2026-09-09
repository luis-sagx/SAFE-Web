import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import HistorialCliente from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('HistorialCliente', () => {
  it('muestra el borrador con los datos de la cuenta de María', () => {
    const telefono = empezar(<HistorialCliente />)
    expect(within(telefono).getByText(/0102345678/)).toBeDefined()
    expect(within(telefono).getByText(/099 456 7890/)).toBeDefined()
  })

  it('pegar todos los datos de la cuenta es el fallo', () => {
    empezar(<HistorialCliente />)
    fireEvent.click(screen.getByRole('button', { name: /Pegar todos los datos de la cuenta y pedir/ }))
    expect(screen.getByText('Datos financieros de un cliente compartidos con la IA')).toBeDefined()
  })

  it('pedir la respuesta solo con el motivo del reclamo es el acierto', () => {
    empezar(<HistorialCliente />)
    fireEvent.click(screen.getByRole('button', { name: /Pedir la respuesta solo con el motivo/ }))
    expect(screen.getByText('Respuesta redactada sin exponer los datos del cliente')).toBeDefined()
  })

  it('pedirle a la IA que no use los datos no deshace haberlos compartido', () => {
    empezar(<HistorialCliente />)
    fireEvent.click(screen.getByRole('button', { name: /pedirle a la IA que no los use/ }))
    expect(screen.getByText('Pedir confidencialidad no deshace haber compartido el dato')).toBeDefined()
  })
})
