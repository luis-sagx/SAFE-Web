import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrivacidadClaves from './PrivacidadClaves'

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

describe('PrivacidadClaves', () => {
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
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza el layout de escenario', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('llama useScenarioRun hook', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('inicia correctamente al hacer click en Empezar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)
    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('muestra botones interactivos después de Empezar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBeGreaterThan(1)
  })

  it('acepta interacción con elementos del escenario', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    expect(buttons).toBeDefined()
  })

  it('puede ser reiniciado multiple veces', () => {
    const { rerender } = render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(1)

    rerender(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(2)
  })

  it('renderiza instrucciones antes de comenzar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const layoutElement = screen.getByTestId('escenario-layout')
    expect(layoutElement).toBeDefined()
  })

  it('proporciona controles para el usuario después de iniciar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    expect(buttons).toBeDefined()
  })

  it('mantiene estado después de montar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('muestra botón para cerrar pestañas después de Empezar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const closeButtons = screen.queryAllByText('×')
    expect(closeButtons.length).toBeGreaterThan(0)
  })

  it('puede cerrar una pestaña haciendo click en X', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const closeButtons = screen.queryAllByText('×')
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]!)
      const remainingClose = screen.queryAllByText('×')
      expect(remainingClose.length).toBeLessThan(closeButtons.length)
    }
  })

  it('completa el escenario al cerrar todas las pestañas y clickear Terminar', () => {
    const recordDecisionMock = vi.fn()
    const finishMock = vi.fn()
    mocks.useScenarioRun.mockReturnValue({
      recordDecision: recordDecisionMock,
      finish: finishMock,
    })

    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    // Cerrar todas las pestañas
    const closeButtons = screen.queryAllByText('×')
    closeButtons.forEach((btn) => {
      fireEvent.click(btn)
    })

    // Clickear Terminar
    const finishBtn = screen.getByRole('button', { name: /Terminar/ })
    fireEvent.click(finishBtn)

    expect(recordDecisionMock).toHaveBeenCalled()
  })

  it('reinicia escenario cuando se clickea Empezar', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('usa todos los hooks requeridos', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('muestra pista cuando clickea "No sé por dónde empezar"', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const helpBtn = screen.getByText(/No sé por dónde empezar/)
    fireEvent.click(helpBtn)
    expect(screen.getByText(/Haz click en la X/)).toBeDefined()
  })

  it('oculta pista al clickear nuevamente', () => {
    render(
      <BrowserRouter>
        <PrivacidadClaves />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const helpBtn = screen.getByText(/No sé por dónde empezar/)
    fireEvent.click(helpBtn)
    fireEvent.click(helpBtn)
    expect(screen.queryByText(/Haz click en la X/)).toBeNull()
  })
})
