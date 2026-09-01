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
      escenarios: [{ id: 'phishing/factura-sri', ultimoOutcome: 'INCORRECTO' }],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    const { container } = renderSeccion()

    expect(await screen.findByText('Contraseña por caducar')).toBeDefined()
    expect(
      container.querySelector('a[href="/seccion/phishing/clave-caducada"]'),
    ).not.toBeNull()
    expect(container.querySelector('a[href="/seccion/phishing/rol-de-pagos"]')).toBeNull()
    // El candado nombra el escenario que lo abre: el primero sin jugar es el
    // 02 (el 01 ya se intentó), así que los seis bloqueados apuntan ahí.
    expect(await screen.findAllByText('Se abre al terminar el 02')).toHaveLength(6)
  })
})
