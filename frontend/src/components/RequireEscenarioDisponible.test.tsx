import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequireAvailableScenario from './RequireEscenarioDisponible'
import { getScenario } from '../data/catalogo'

const { fetchProgressMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchProgress: fetchProgressMock }
})

// 'salida-segura' es el primero del módulo y 'trampa-usb' el segundo (ver
// catalogo.ts): entrar al segundo exige que el primero conste como jugado.
const first = getScenario('fisico/salida-segura')!
const second = getScenario('fisico/trampa-usb')!

function renderWithStatus(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/seccion/fisico/trampa-usb', state }]}>
      <Routes>
        <Route
          path="/seccion/fisico/trampa-usb"
          element={
            <RequireAvailableScenario escenario={second}>
              <p>Contenido del escenario</p>
            </RequireAvailableScenario>
          }
        />
        <Route path="/seccion/:seccionId" element={<p>Página de la sección</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireEscenarioDisponible', () => {
  beforeEach(() => {
    fetchProgressMock.mockReset()
  })

  it('deja entrar cuando el progreso del servidor ya trae el escenario anterior', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: first.id, ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 5,
      aprobado: false,
    })

    renderWithStatus(undefined)

    expect(await screen.findByText('Contenido del escenario')).toBeDefined()
  })

  it('rebota a la sección si el escenario anterior no consta como jugado', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [],
      aprobados: 0,
      requeridos: 5,
      aprobado: false,
    })

    renderWithStatus(undefined)

    expect(await screen.findByText('Página de la sección')).toBeDefined()
  })

  it('confía en "recienCompletado" aunque el servidor todavía no lo haya registrado', async () => {
    // Reproduce la carrera: el botón "Siguiente escenario" navega apenas se
    // termina la corrida, y el POST que la guarda puede no haber llegado
    // todavía cuando esta pantalla pide el progreso.
    fetchProgressMock.mockResolvedValue({
      escenarios: [],
      aprobados: 0,
      requeridos: 5,
      aprobado: false,
    })

    renderWithStatus({ recienCompletado: first.id })

    expect(await screen.findByText('Contenido del escenario')).toBeDefined()
  })

  it('deja pasar el siguiente inmediato aunque el progreso todavía no refleje corridas previas', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [],
      aprobados: 0,
      requeridos: 5,
      aprobado: false,
    })

    renderWithStatus({ recienCompletado: first.id })

    expect(await screen.findByText('Contenido del escenario')).toBeDefined()
  })
})
