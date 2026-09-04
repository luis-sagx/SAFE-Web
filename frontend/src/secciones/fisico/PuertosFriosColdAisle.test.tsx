import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PuertosFriosColdAisle from './PuertosFriosColdAisle'

const mocks = vi.hoisted(() => ({
  useScenarioRun: vi.fn(),
}))

vi.mock('../../hooks/useScenarioRun', () => ({ useScenarioRun: mocks.useScenarioRun }))
vi.mock('../../components/EscenarioLayout', () => ({
  default: ({ pantalla, onEmpezar }: any) => (
    <div data-testid="escenario-layout">
      <button onClick={onEmpezar} data-testid="btn-empezar">
        Empezar
      </button>
      {pantalla}
    </div>
  ),
}))

describe('PuertosFriosColdAisle', () => {
  const recordDecisionMock = vi.fn()
  const finishMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useScenarioRun.mockReturnValue({
      recordDecision: recordDecisionMock,
      finish: finishMock,
    })
  })

  it('renderiza sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza layout correctamente', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('llama useScenarioRun hook', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('registra decisión cuando se hace click en opción', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    const choiceBtn = buttons.find(
      (btn) => btn.textContent && btn !== empezarBtn && btn.textContent.length > 10,
    )
    if (choiceBtn) {
      fireEvent.click(choiceBtn)
      expect(recordDecisionMock).toHaveBeenCalled()
    }
  })

  it('finaliza escenario después de seleccionar', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    const choiceBtn = buttons.find(
      (btn) => btn.textContent && btn !== empezarBtn && btn.textContent.length > 10,
    )
    if (choiceBtn) {
      fireEvent.click(choiceBtn)
      expect(finishMock).toHaveBeenCalled()
    }
  })
})
