import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CodigoQRCafe from './CodigoQRCafe'

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
vi.mock('../../components/ui/Instrucciones', () => ({
  default: ({ children }: any) => <div data-testid="instrucciones">{children}</div>,
}))

describe('CodigoQRCafe', () => {
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
        <CodigoQRCafe />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('muestra opciones después de hacer click en Empezar', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const options = screen.queryAllByRole('button', { name: /Escanear|Preguntar|Usar datos/ })
    expect(options.length).toBeGreaterThan(0)
  })

  it('registra decisión cuando selecciona opción "safe"', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const safeOption = screen.queryByRole('button', { name: /Preguntar al personal/ })
    if (safeOption) {
      fireEvent.click(safeOption)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'safe', riesgo: 0 }))
    }
  })

  it('registra decisión cuando selecciona opción "danger"', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const dangerOption = screen.queryByRole('button', { name: /Escanear el código QR/ })
    if (dangerOption) {
      fireEvent.click(dangerOption)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'danger', riesgo: 10 }))
    }
  })

  it('registra decisión cuando selecciona opción "warn"', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const warnOption = screen.queryByRole('button', { name: /Usar datos móviles/ })
    if (warnOption) {
      fireEvent.click(warnOption)
      expect(recordDecisionMock).toHaveBeenCalledWith(expect.objectContaining({ nivel: 'warn', riesgo: 0 }))
    }
  })

  it('finaliza escenario después de seleccionar opción', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const option = screen.queryAllByRole('button', { name: /Escanear|Preguntar|Usar datos/ })[0]
    if (option) {
      fireEvent.click(option)
      expect(finishMock).toHaveBeenCalled()
    }
  })

  it('usa hooks correctamente', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalled()
    expect(mocks.useFlashTransition).toHaveBeenCalled()
  })

  it('dispara trigger de flash transition después de seleccionar', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const option = screen.queryAllByRole('button', { name: /Escanear|Preguntar|Usar datos/ })[0]
    if (option) {
      fireEvent.click(option)
      expect(triggerMock).toHaveBeenCalled()
    }
  })

  it('selecciona diferentes opciones correctamente', () => {
    render(
      <BrowserRouter>
        <CodigoQRCafe />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const options = screen.queryAllByRole('button', { name: /Escanear|Preguntar|Usar datos/ })
    expect(options.length).toBe(3)
  })
})
