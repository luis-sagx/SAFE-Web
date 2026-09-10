import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import HistorialCliente from './HistorialCliente'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('HistorialCliente', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<HistorialCliente />)
    expect(within(pantalla).getByText('Hola, ayúdame a responder el reclamo de una clienta.')).toBeDefined()
    expect(within(pantalla).getByText(/Cuénteme qué reclama la clienta/)).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const pantalla = empezar(<HistorialCliente />)
    expect(within(pantalla).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('pegar todos los datos de la cuenta es el fallo, y cada dato se señala solo', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(
      within(pantalla).getByRole('button', { name: /^Reclama por qué le cobramos \$45 de más este mes\. Sus datos.*0045\.$/ }),
    )
    expect(screen.getByText('Datos financieros de una clienta compartidos con la IA')).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-cuenta"]')?.textContent).toBe('2100-0000-45')
    expect(pantalla.querySelector('[data-signal="dato-saldo"]')?.textContent).toBe('$2.340,15')
    expect(pantalla.querySelector('[data-signal="dato-telefono"]')?.textContent).toBe('099 000 0045')
  })

  it('pedir la respuesta solo con el motivo del reclamo es el acierto', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /No inventes datos de la cuenta/ }))
    expect(screen.getByText('Respuesta redactada sin exponer los datos de la clienta')).toBeDefined()
  })

  it('pedirle a la IA que no guarde los datos no deshace haberlos compartido', () => {
    const pantalla = empezar(<HistorialCliente />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /son confidenciales/ }))
    expect(screen.getByText('Pedir confidencialidad no deshace haber compartido el dato')).toBeDefined()
  })
})
