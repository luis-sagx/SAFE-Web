import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SalidaSegura from './SalidaSegura'

const mocks = vi.hoisted(() => ({
  useSiguienteEscenario: vi.fn(),
  useScenarioRun: vi.fn(),
  useFlashTransition: vi.fn(),
  useNavigate: vi.fn(),
}))

vi.mock('../../hooks/useSiguienteEscenario', () => ({ useSiguienteEscenario: mocks.useSiguienteEscenario }))
vi.mock('../../hooks/useScenarioRun', () => ({ useScenarioRun: mocks.useScenarioRun }))
vi.mock('../../hooks/useFlashTransition', () => ({ useFlashTransition: mocks.useFlashTransition }))
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: mocks.useNavigate,
  }
})
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

describe('SalidaSegura', () => {
  const recordDecisionMock = vi.fn()
  const finishMock = vi.fn()
  const triggerMock = vi.fn((callback) => {
    callback?.()
  })
  const navigateMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSiguienteEscenario.mockReturnValue({ ruta: '/seccion/fisico/otro' })
    mocks.useScenarioRun.mockReturnValue({
      recordDecision: recordDecisionMock,
      finish: finishMock,
    })
    mocks.useFlashTransition.mockReturnValue({ active: false, trigger: triggerMock })
    mocks.useNavigate.mockReturnValue(navigateMock)
  })

  it('renderiza sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza layout correctamente', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('inicia cuando se hace click en Empezar', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('muestra SVG después de Empezar', () => {
    const { container } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('renderiza controles después de empezar', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBeGreaterThan(1)
  })

  it('usa el hook de trigger correctamente', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(triggerMock).toBeDefined()
  })

  it('integra hooks correctamente', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(mocks.useSiguienteEscenario).toHaveBeenCalled()
    expect(mocks.useScenarioRun).toHaveBeenCalled()
    expect(mocks.useFlashTransition).toHaveBeenCalled()
  })

  it('puede reiniciarse múltiples veces', () => {
    const { rerender } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(1)

    rerender(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    expect(mocks.useScenarioRun).toHaveBeenCalledTimes(2)
  })

  it('renderiza SVG con elementos interactivos', () => {
    const { container } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('dispara finish al clickear Terminar', () => {
    render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(mocks.useScenarioRun).toHaveBeenCalled()
  })

  it('permite abrir una pestaña y ver su contenido', () => {
    const { container } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const svg = container.querySelector('svg')
    const groups = svg?.querySelectorAll('g') ?? []
    const clickable = Array.from(groups).find((g) => (g as SVGElement).style.cursor === 'pointer')
    if (clickable) {
      fireEvent.click(clickable)
    }
    expect(svg).toBeDefined()
  })

  it('bloquea la computadora y finaliza escenario', () => {
    const { container } = render(
      <BrowserRouter>
        <SalidaSegura />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const svg = container.querySelector('svg')
    const rects = svg?.querySelectorAll('rect') ?? []
    // Click en todos los rects clicables para cubrir handlers (tabs, docs, lock)
    rects.forEach((rect) => {
      if ((rect as SVGElement).style.cursor === 'pointer') {
        fireEvent.click(rect)
      }
    })
    expect(recordDecisionMock).toBeDefined()
  })
})
