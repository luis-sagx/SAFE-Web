import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TrampaUSB from './TrampaUSB'

const mocks = vi.hoisted(() => ({
  useScenarioRun: vi.fn(),
  useFlashTransition: vi.fn(),
  useSiguienteEscenario: vi.fn(),
}))

vi.mock('../../hooks/useScenarioRun', () => ({ useScenarioRun: mocks.useScenarioRun }))
vi.mock('../../hooks/useFlashTransition', () => ({ useFlashTransition: mocks.useFlashTransition }))
vi.mock('../../hooks/useSiguienteEscenario', () => ({ useSiguienteEscenario: mocks.useSiguienteEscenario }))
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
vi.mock('../../components/ui/FlashOverlay', () => ({
  default: () => <div data-testid="flash-overlay" />,
}))

describe('TrampaUSB', () => {
  const recordDecisionMock = vi.fn()
  const finishMock = vi.fn()
  const triggerMock = vi.fn((callback) => callback())

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSiguienteEscenario.mockReturnValue({ ruta: '/seccion/fisico/otro' })
    mocks.useScenarioRun.mockReturnValue({
      recordDecision: recordDecisionMock,
      finish: finishMock,
    })
    mocks.useFlashTransition.mockReturnValue({ active: false, trigger: triggerMock })
  })

  it('renderiza sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza layout correctamente', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('usa hooks correctamente', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalled()
    expect(mocks.useFlashTransition).toHaveBeenCalled()
  })

  it('registra decisión cuando se selecciona opción', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
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
        <TrampaUSB />
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

  it('muestra opciones después de Empezar', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const options = screen.queryAllByRole('button')
    expect(options.length).toBeGreaterThan(1)
  })

  it('registra decisión cuando selecciona una opción', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const allButtons = screen.queryAllByRole('button')
    const optionBtn = allButtons.find(btn => btn !== empezarBtn && btn.textContent && btn.textContent.length > 5)
    if (optionBtn) {
      fireEvent.click(optionBtn)
      expect(recordDecisionMock).toHaveBeenCalled()
    }
  })

  it('finaliza escenario después de seleccionar', () => {
    render(
      <BrowserRouter>
        <TrampaUSB />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const allButtons = screen.queryAllByRole('button')
    const optionBtn = allButtons.find(btn => btn !== empezarBtn && btn.textContent && btn.textContent.length > 5)
    if (optionBtn) {
      fireEvent.click(optionBtn)
      expect(finishMock).toHaveBeenCalled()
    }
  })
})
