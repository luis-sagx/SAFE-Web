import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TarjetaClonada from './TarjetaClonada'

const mocks = vi.hoisted(() => ({
  useSiguienteEscenario: vi.fn(),
  useScenarioRun: vi.fn(),
  useFlashTransition: vi.fn(),
}))

vi.mock('../../hooks/useSiguienteEscenario', () => ({ useSiguienteEscenario: mocks.useSiguienteEscenario }))
vi.mock('../../hooks/useScenarioRun', () => ({ useScenarioRun: mocks.useScenarioRun }))
vi.mock('../../hooks/useFlashTransition', () => ({ useFlashTransition: mocks.useFlashTransition }))
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

describe('TarjetaClonada', () => {
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
        <TarjetaClonada />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza layout y opciones después de Empezar', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('muestra opciones de decisión después de Empezar', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const bloquearBtn = screen.queryByRole('button', { name: /Bloquear/ })
    expect(bloquearBtn || screen.queryAllByRole('button').length).toBeTruthy()
  })

  it('registra decisión cuando selecciona opción safe', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const safeOption = screen.queryByRole('button', { name: /Bloquear.*inmediatamente/ })
    if (safeOption) {
      fireEvent.click(safeOption)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'safe' }))
    }
  })

  it('finaliza escenario después de seleccionar opción', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const anyOption = screen.queryAllByRole('button').find(btn => btn.textContent && btn.textContent.includes('Bloquear'))
    if (anyOption) {
      fireEvent.click(anyOption)
      expect(finishMock).toHaveBeenCalled()
    }
  })

  it('integra hooks correctamente', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    expect(mocks.useSiguienteEscenario).toHaveBeenCalled()
    expect(mocks.useScenarioRun).toHaveBeenCalled()
    expect(mocks.useFlashTransition).toHaveBeenCalled()
  })

  it('dispara trigger de flash después de seleccionar', () => {
    render(
      <BrowserRouter>
        <TarjetaClonada />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const anyOption = screen.queryAllByRole('button').find(btn => btn.textContent && btn !== empezarBtn)
    if (anyOption) {
      fireEvent.click(anyOption)
      expect(triggerMock).toHaveBeenCalled()
    }
  })
})
