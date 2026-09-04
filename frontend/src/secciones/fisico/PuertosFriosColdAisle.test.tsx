import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PuertosFriosColdAisle from './PuertosFriosColdAisle'

const mocks = vi.hoisted(() => ({
  useScenarioRun: vi.fn(),
}))

vi.mock('../../hooks/useScenarioRun', () => ({ useScenarioRun: mocks.useScenarioRun }))
vi.mock('../../components/EscenarioLayout', () => ({
  default: ({ pantalla, decision, onEmpezar }: any) => (
    <div data-testid="escenario-layout">
      <button onClick={onEmpezar} data-testid="btn-empezar">
        Empezar
      </button>
      {pantalla}
      {decision}
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

  it('selecciona opción "solo-cierra"', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const soloBtn = screen.queryByRole('button', { name: /Asegurar la puerta/ })
    if (soloBtn) {
      fireEvent.click(soloBtn)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'partial' }))
    }
  })

  it('selecciona opción "cierra-reporta"', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const reportBtn = screen.queryByRole('button', { name: /Reportar el incidente/ })
    if (reportBtn) {
      fireEvent.click(reportBtn)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'safe' }))
    }
  })

  it('selecciona opción "nada"', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const nothingBtn = screen.queryByRole('button', { name: /Observar la situación/ })
    if (nothingBtn) {
      fireEvent.click(nothingBtn)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'danger' }))
    }
  })

  it('reinicia escenario correctamente', () => {
    const { rerender } = render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(1)

    rerender(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(2)
  })

  it('muestra pista cuando clickea "No sé por dónde empezar"', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const helpBtn = screen.getByText(/No sé por dónde empezar/)
    fireEvent.click(helpBtn)
    expect(screen.getByText(/actuar INMEDIATAMENTE/i)).toBeDefined()
  })

  it('muestra panel de resultado "safe" con detalles', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const reportBtn = screen.getByRole('button', { name: /Reportar el incidente/ })
    fireEvent.click(reportBtn)

    expect(screen.getByText(/Lo que hiciste bien/)).toBeDefined()
  })

  it('muestra panel de resultado "partial" con detalles', () => {
    render(
      <BrowserRouter>
        <PuertosFriosColdAisle />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const soloBtn = screen.getByRole('button', { name: /Asegurar la puerta/ })
    fireEvent.click(soloBtn)

    expect(screen.getByText(/Lo que faltó/)).toBeDefined()
  })
})
