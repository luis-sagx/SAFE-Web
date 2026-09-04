import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PuertosFriosColdAisle from './PuertosFriosColdAisle'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('PuertosFriosColdAisle', () => {
  it('abre con la puerta del puerto frío abierta', () => {
    empezar(<PuertosFriosColdAisle />)

    expect(screen.getByText(/menos de 3 minutos para actuar/)).toBeDefined()
  })

  it('la pista explica la mejor respuesta sin revelarla del todo', () => {
    empezar(<PuertosFriosColdAisle />)

    fireEvent.click(screen.getByText(/No sé por dónde empezar/))

    expect(screen.getByText(/actuar INMEDIATAMENTE/)).toBeDefined()
  })

  it('cerrar y reportar es la decisión excelente', async () => {
    const telefono = empezar(<PuertosFriosColdAisle />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Reportar el incidente/ }))

    expect(await screen.findByText('Decisión excelente')).toBeDefined()
    expect(screen.getByText(/Lo que hiciste bien/)).toBeDefined()
  })

  it('solo cerrar la puerta es una respuesta incompleta', async () => {
    const telefono = empezar(<PuertosFriosColdAisle />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Asegurar la puerta/ }))

    expect(await screen.findByText('Acción rápida, respuesta incompleta')).toBeDefined()
    expect(screen.getByText(/Lo que faltó/)).toBeDefined()
  })

  it('no hacer nada es el fallo crítico', async () => {
    const telefono = empezar(<PuertosFriosColdAisle />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Observar la situación/ }))

    expect(await screen.findByText('Fallo crítico - Equipos comprometidos')).toBeDefined()
  })
})
