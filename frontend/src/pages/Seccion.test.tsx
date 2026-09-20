import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Section from './Seccion'
import { getScenarioPath, getSectionScenarios } from '../data/catalogo'

const { fetchProgressMock, fetchMyRunsMock, restartModuleMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
  fetchMyRunsMock: vi.fn(),
  restartModuleMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchProgress: fetchProgressMock, fetchMyRuns: fetchMyRunsMock, restartModule: restartModuleMock }
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
    restartModuleMock.mockReset()
    fetchMyRunsMock.mockResolvedValue([])
  })

  it('permite reiniciar un módulo incompleto y muestra la ronda nueva en cero', async () => {
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [{ id: 'phishing/loteria-premiada', ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    restartModuleMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: [],
      aprobados: 0,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    const { container } = renderSection()
    fireEvent.click(await screen.findByRole('button', { name: 'Repetir el módulo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar módulo' }))

    await waitFor(() => expect(screen.getByText('0', { selector: 'span.tabular-nums' })).toBeDefined())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('a[href="/seccion/phishing/loteria-premiada"]')).not.toBeNull()
    expect(screen.queryByText('Aprobado')).toBeNull()
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
    expect(container.querySelector('a[href="/seccion/phishing/loteria-premiada"]')).toBeNull()
    expect(screen.queryByText('Repetir →')).toBeNull()
    // Cada candado nombra el escenario justo anterior en la lista, no un
    // número compartido: el 08 depende del 07, no del 02.
    expect(await screen.findByText('Se abre al terminar el 02')).toBeDefined()
    expect(await screen.findByText('Se abre al terminar el 07')).toBeDefined()
  })

  it('en una repetición completa ofrece continuar con el próximo escenario, sin repetir uno suelto', async () => {
    const scenarios = getSectionScenarios('phishing')
    const [first, next] = scenarios
    if (!first || !next) throw new Error('El módulo necesita al menos dos escenarios')
    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: scenarios.map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: scenarios.length,
      requeridos: 6,
      aprobado: true,
      ronda: 2,
      rondaEnCurso: {
        jugados: 1,
        escenarios: [{ id: first.id, ultimoOutcome: 'CORRECTO' }],
      },
    })

    const { container } = renderSection()

    expect(await screen.findByText('Continuar →')).toBeDefined()
    expect(screen.queryByText('Repetir →')).toBeNull()
    expect(container.querySelector(`a[href="${getScenarioPath(first)}"]`)).toBeNull()
    expect(container.querySelector(`a[href="${getScenarioPath(next)}"]`)).not.toBeNull()
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

  // Issue #279: durante una repetición, los escenarios que todavía no se
  // rejugaron esta vez muestran el resultado del intento anterior (a
  // propósito, ver el test de arriba), pero sin aclararlo se leía como si
  // "4/4 aprobados" y un "Sin aprobar" en rojo fueran del mismo momento.
  it('marca como "del intento anterior" el resultado de un escenario no rejugado esta repetición', async () => {
    const scenarios = getSectionScenarios('phishing')
    const [first, second] = scenarios
    if (!first || !second) throw new Error('El módulo necesita al menos dos escenarios')

    fetchProgressMock.mockResolvedValue({
      modulo: 'phishing',
      escenarios: scenarios.map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: scenarios.length,
      requeridos: 6,
      aprobado: true,
      ronda: 2,
      rondaEnCurso: {
        jugados: 1,
        // Se rejugó y esta vez falló: su insignia es del intento ACTUAL, no
        // debe llevar la aclaración.
        escenarios: [{ id: first.id, ultimoOutcome: 'INCORRECTO' }],
      },
    })

    renderSection()

    await screen.findByText('Sin aprobar')
    const notices = await screen.findAllByText('Resultado del intento anterior')

    // Uno por cada escenario salvo el que sí se rejugó esta ronda.
    expect(notices).toHaveLength(scenarios.length - 1)
  });

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
