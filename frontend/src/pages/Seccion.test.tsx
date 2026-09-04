import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Seccion from './Seccion'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

function renderSeccion() {
  return render(
    <MemoryRouter initialEntries={['/seccion/phishing']}>
      <Routes>
        <Route path="/seccion/:seccionId" element={<Seccion />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Seccion', () => {
  beforeEach(() => {
    fetchProgresoMock.mockReset()
  })

  it('solo deja como link activo el próximo escenario pendiente y bloquea los posteriores', async () => {
    fetchProgresoMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [{ id: 'phishing/loteria-premiada', ultimoOutcome: 'INCORRECTO' }],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    const { container } = renderSeccion()

    expect(await screen.findByText('Factura por validar')).toBeDefined()
    expect(
      container.querySelector('a[href="/seccion/phishing/factura-sri"]'),
    ).not.toBeNull()
    expect(container.querySelector('a[href="/seccion/phishing/clave-caducada"]')).toBeNull()
    // Cada candado nombra el escenario justo anterior en la lista, no un
    // número compartido: el 08 depende del 07, no del 02.
    expect(await screen.findByText('Se abre al terminar el 02')).toBeDefined()
    expect(await screen.findByText('Se abre al terminar el 07')).toBeDefined()
  })
})
