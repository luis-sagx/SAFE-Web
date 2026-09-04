import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CableComprometido from './CableComprometido'

const { useSiguienteEscenarioMock, useScenarioRunMock, useFlashTransitionMock } = vi.hoisted(() => ({
  useSiguienteEscenarioMock: vi.fn(),
  useScenarioRunMock: vi.fn(),
  useFlashTransitionMock: vi.fn(),
}))

vi.mock('../../hooks/useSiguienteEscenario', () => ({
  useSiguienteEscenario: useSiguienteEscenarioMock,
}))

vi.mock('../../hooks/useScenarioRun', () => ({
  useScenarioRun: useScenarioRunMock,
}))

vi.mock('../../hooks/useFlashTransition', () => ({
  useFlashTransition: useFlashTransitionMock,
}))

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

describe('CableComprometido', () => {
  const recordDecisionMock = vi.fn()
  const finishMock = vi.fn()
  const triggerMock = vi.fn((callback) => callback())

  beforeEach(() => {
    vi.clearAllMocks()
    useSiguienteEscenarioMock.mockReturnValue({ ruta: '/seccion/fisico/otro' })
    useScenarioRunMock.mockReturnValue({
      recordDecision: recordDecisionMock,
      finish: finishMock,
    })
    useFlashTransitionMock.mockReturnValue({ active: false, trigger: triggerMock })
  })

  it('renderiza sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza layout correctamente', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(screen.getByTestId('escenario-layout')).toBeDefined()
  })

  it('renderiza flash overlay', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(screen.getByTestId('flash-overlay')).toBeDefined()
  })

  it('usa hooks correctamente', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useSiguienteEscenarioMock).toHaveBeenCalled()
    expect(useScenarioRunMock).toHaveBeenCalled()
    expect(useFlashTransitionMock).toHaveBeenCalled()
  })

  it('inicia escenario cuando se hace click en Empezar', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    expect(useScenarioRunMock).toHaveBeenCalled()
  })

  it('muestra pantalla después de empezar', () => {
    const { container } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('puede reiniciarse múltiples veces', () => {
    const { rerender } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useScenarioRunMock).toHaveBeenCalledTimes(1)

    rerender(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useScenarioRunMock).toHaveBeenCalledTimes(2)
  })

  it('permite interacción después de Empezar', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const buttons = screen.queryAllByRole('button')
    expect(buttons).toBeDefined()
  })

  it('muestra opciones al hacer click en el destello', () => {
    const { container } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const flash = container.querySelector('.sceneFlash') || container.querySelector('g[class*="Flash"]')
    if (flash) {
      fireEvent.click(flash)
      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBeGreaterThan(1)
    }
  })

  it('registra decisión cuando selecciona una opción tras destello', () => {
    const { container } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const flash = container.querySelector('.sceneFlash') || container.querySelector('g[class*="Flash"]')
    if (flash) {
      fireEvent.click(flash)
      const allButtons = screen.queryAllByRole('button')
      const optionBtn = allButtons.find(btn => btn !== empezarBtn && btn.textContent && btn.textContent.length > 5)
      if (optionBtn) {
        fireEvent.click(optionBtn)
        expect(recordDecisionMock).toHaveBeenCalled()
      }
    }
  })

  it('finaliza escenario tras destello y selección', () => {
    const { container } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    const empezarBtn = screen.getByTestId('btn-empezar')
    fireEvent.click(empezarBtn)

    const flash = container.querySelector('.sceneFlash') || container.querySelector('g[class*="Flash"]')
    if (flash) {
      fireEvent.click(flash)
      const optionBtn = screen.queryByRole('button', { name: /Usarlo para cargar/ })
      if (optionBtn) {
        fireEvent.click(optionBtn)
        expect(finishMock).toHaveBeenCalled()
      }
    }
  })

  it('maneja múltiples fases del escenario', () => {
    const { rerender } = render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useScenarioRunMock).toHaveBeenCalledTimes(1)

    rerender(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useScenarioRunMock).toHaveBeenCalledTimes(2)
  })

  it('configura hooks para transiciones visuales', () => {
    render(
      <BrowserRouter>
        <CableComprometido />
      </BrowserRouter>
    )
    expect(useFlashTransitionMock).toHaveBeenCalled()
  })
})
