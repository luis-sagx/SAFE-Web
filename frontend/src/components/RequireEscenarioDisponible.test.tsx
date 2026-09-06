import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RequireEscenarioDisponible from './RequireEscenarioDisponible'
import { getEscenario } from '../data/catalogo'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

// 'salida-segura' es el primero del módulo y 'trampa-usb' el segundo (ver
// catalogo.ts): entrar al segundo exige que el primero conste como jugado.
const primero = getEscenario('fisico/salida-segura')!
const segundo = getEscenario('fisico/trampa-usb')!

function renderConEstado(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/seccion/fisico/trampa-usb', state }]}>
      <Routes>
        <Route
          path="/seccion/fisico/trampa-usb"
          element={
            <RequireEscenarioDisponible escenario={segundo}>
              <p>Contenido del escenario</p>
            </RequireEscenarioDisponible>
          }
        />
        <Route path="/seccion/:seccionId" element={<p>Página de la sección</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireEscenarioDisponible', () => {
  beforeEach(() => {
    fetchProgresoMock.mockReset()
  })

  it('deja entrar cuando el progreso del servidor ya trae el escenario anterior', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: primero.id, ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 5,
      aprobado: false,
    })

    renderConEstado(undefined)

    expect(await screen.findByText('Contenido del escenario')).toBeDefined()
  })

  it('rebota a la sección si el escenario anterior no consta como jugado', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [],
      aprobados: 0,
      requeridos: 5,
      aprobado: false,
    })

    renderConEstado(undefined)

    expect(await screen.findByText('Página de la sección')).toBeDefined()
  })

  it('confía en "recienCompletado" aunque el servidor todavía no lo haya registrado', async () => {
    // Reproduce la carrera: el botón "Siguiente escenario" navega apenas se
    // termina la corrida, y el POST que la guarda puede no haber llegado
    // todavía cuando esta pantalla pide el progreso.
    fetchProgresoMock.mockResolvedValue({
      escenarios: [],
      aprobados: 0,
      requeridos: 5,
      aprobado: false,
    })

    renderConEstado({ recienCompletado: primero.id })

    expect(await screen.findByText('Contenido del escenario')).toBeDefined()
  })
})
