import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Section from './Seccion'

const { fetchProgressMock, fetchMyRunsMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
  fetchMyRunsMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchProgress: fetchProgressMock, fetchMyRuns: fetchMyRunsMock }
})

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/seccion/phishing']}>
      <Routes>
        <Route path="/seccion/:seccionId" element={<Section />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Seccion', () => {
  beforeEach(() => {
    fetchProgressMock.mockReset()
    fetchMyRunsMock.mockReset()
    fetchMyRunsMock.mockResolvedValue([])
  })

  it('solo deja como link activo el próximo escenario pendiente y bloquea los posteriores', async () => {
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [{ id: 'phishing/loteria-premiada', ultimoOutcome: 'INCORRECTO' }],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
    })

    const { container } = renderSection()

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

  it('con el módulo aprobado, abre el resumen en un modal al pedirlo', async () => {
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [],
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
    })

    renderSection()

    const button = await screen.findByRole('button', { name: 'Ver resumen del módulo' })
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(button)

    expect(await screen.findByRole('dialog')).toBeDefined()
  })

  // Bug reportado: al repetir un solo escenario después de terminar el
  // módulo completo, el servidor abre una ronda nueva con ese único
  // escenario (`rondaEnCurso`). Los otros siete no dejan de estar aprobados
  // solo porque todavía no se repitieron en esta ronda.
  it('repetir un escenario no borra la insignia de "Aprobado" de los demás', async () => {
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: Array.from({ length: 8 }, (_, i) => ({
        id: `phishing/${['loteria-premiada', 'factura-sri', 'clave-caducada', 'rol-de-pagos', 'quishing-actualice', 'secuestro-hilo', 'aviso-filtracion', 'sesion-bogota'][i]}`,
        ultimoOutcome: 'CORRECTO',
      })),
      aprobados: 8,
      requeridos: 6,
      aprobado: true,
      ronda: 2,
      rondaEnCurso: {
        jugados: 1,
        escenarios: [{ id: 'phishing/loteria-premiada', ultimoOutcome: 'CORRECTO' }],
      },
    })

    renderSection()

    expect(await screen.findAllByText('Aprobado')).toHaveLength(8)
  })

  it('considera desbloqueado el módulo siguiente al terminar todos los escenarios aunque la nota sea menor a 6', async () => {
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: Array.from({ length: 8 }, (_, i) => ({ id: `phishing/e${i}`, ultimoOutcome: 'INCORRECTO' })),
      aprobados: 4,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    renderSection()
    expect(await screen.findByText('Smishing')).toBeDefined()
    expect(screen.getByRole('link', { name: /Smishing/ })).toBeDefined()
  })
})
