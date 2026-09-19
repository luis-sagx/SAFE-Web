import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SchoolReport from './InformeEscolar'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

// Se prueba a través de un escenario real (InformeEscolar) y no con una
// historia sintética: es el propio wrapper compartido el que importa (issue
// #241), y los cuatro escenarios de asistentes-ia lo usan igual.
describe('AIChatScenario (marco común de asistentes-ia)', () => {
  it('explica el objetivo general del módulo antes de la instrucción propia del escenario', () => {
    start(<SchoolReport />)

    expect(
      screen.getByText(/Aquí no hay nadie tratando de engañarte/),
    ).toBeDefined()
    // La instrucción propia del escenario se conserva, no se reemplaza.
    expect(screen.getByText(/toca "Enviar" cuando el/)).toBeDefined()
  })
})
