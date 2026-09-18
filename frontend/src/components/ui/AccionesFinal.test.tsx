import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FinalActions from './AccionesFinal'
import { getSectionScenarios } from '../../data/catalogo'

const { fetchProgressMock, restartModuleMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
  restartModuleMock: vi.fn(),
}))

vi.mock('../../lib/api', async () => {
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, fetchProgress: fetchProgressMock, restartModule: restartModuleMock }
})

describe('AccionesFinal', () => {
  const mockOnRestart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchProgressMock.mockReset()
    restartModuleMock.mockReset()
  })

  it('desde el veredicto reinicia un módulo incompleto y vuelve a la sección', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    restartModuleMock.mockResolvedValue({ escenarios: [], aprobados: 0 })

    render(
      <MemoryRouter initialEntries={['/seccion/fisico/salida-segura']}>
        <Routes>
          <Route path="/seccion/fisico/salida-segura" element={<FinalActions escenarioId="fisico/salida-segura" outcome="CORRECTO" />} />
          <Route path="/seccion/fisico" element={<p>Sección reiniciada</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Repetir el módulo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar módulo' }))
    expect(await screen.findByText('Sección reiniciada')).toBeDefined()
  })

  it('renderiza sin errores cuando hay progreso', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <FinalActions
          escenarioId="fisico/salida-segura"
          outcome="CORRECTO"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })

  it('apunta al siguiente escenario del catálogo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 5,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    render(<BrowserRouter><FinalActions escenarioId="fisico/salida-segura" outcome="CORRECTO" /></BrowserRouter>)
    expect((await screen.findByRole('link', { name: 'Siguiente escenario →' })).getAttribute('href')).toBe(
      '/seccion/fisico/trampa-usb',
    )
  })

  it('al aprobar el módulo permite avanzar o reiniciarlo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    expect((await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).getAttribute('href')).toBe('/seccion/smishing')
    expect(screen.getByRole('button', { name: 'Repetir el módulo' })).toBeDefined()
  })

  it('al no aprobar mantiene la opción de repetir además de avanzar', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'INCORRECTO' })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="INCORRECTO" /></BrowserRouter>)

    expect(await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Repetir el módulo' })).toBeDefined()
  })

  it('calcula la nota final con el resultado que aún se está guardando', async () => {
    const previousScenarios = getSectionScenarios('phishing').filter(({ id }) => id !== 'phishing/sesion-bogota')
    fetchProgressMock.mockResolvedValue({
      escenarios: previousScenarios.map(({ id }, index) => ({
        id,
        ultimoOutcome: index < 5 ? 'CORRECTO' : 'INCORRECTO',
      })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    expect(await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Repetir el módulo' })).toBeDefined()
  })

  it('continúa la repetición cuando el primer resultado todavía no llegó al servidor', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 8,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/seccion/phishing/loteria-premiada', state: { iniciarRepeticion: true } }]}>
        <FinalActions escenarioId="phishing/loteria-premiada" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    await screen.findByText(
      (_, element) => element?.textContent === 'Llevas 1 de los 6 que necesitas para aprobar el módulo.',
    )
    expect(screen.getByRole('link', { name: 'Siguiente escenario →' }).getAttribute('href')).toBe('/seccion/phishing/factura-sri')
  })

  it('conserva todos los escenarios provisionales al avanzar una repetición', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 8,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/seccion/phishing/factura-sri',
        state: {
          iniciarRepeticion: true,
          repeticionIntentados: [{ id: 'phishing/loteria-premiada', outcome: 'CORRECTO' }],
        },
      }]}>
        <FinalActions escenarioId="phishing/factura-sri" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    await screen.findByText(
      (_, element) => element?.textContent === 'Llevas 2 de los 6 que necesitas para aprobar el módulo.',
    )
    expect(screen.getByRole('link', { name: 'Siguiente escenario →' }).getAttribute('href')).toBe('/seccion/phishing/clave-caducada')
  })

  it('conserva el resultado incorrecto de intentos provisionales', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 8,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/seccion/phishing/factura-sri',
        state: {
          iniciarRepeticion: true,
          repeticionIntentados: [{ id: 'phishing/loteria-premiada', outcome: 'INCORRECTO' }],
        },
      }]}>
        <FinalActions escenarioId="phishing/factura-sri" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    expect(await screen.findByText(
      (_, element) => element?.textContent === 'Llevas 1 de los 6 que necesitas para aprobar el módulo.',
    )).toBeDefined()
  })

  it('lleva al panel al terminar el último módulo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('asistentes-ia').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 4,
      requeridos: 3,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="asistentes-ia/historial-cliente" outcome="CORRECTO" /></BrowserRouter>)

    expect((await screen.findByRole('link', { name: 'Volver al panel →' })).getAttribute('href')).toBe('/dashboard')
  })

  it('renderiza sin errores cuando no hay progreso', async () => {
    fetchProgressMock.mockRejectedValue(new Error('sin red'))

    const { container } = render(
      <BrowserRouter>
        <FinalActions
          escenarioId="fisico/salida-segura"
          outcome="CORRECTO"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })

  it('al aprobar el módulo con uno siguiente disponible, primero pide el mini-test (issue #230)', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    expect(await screen.findByRole('dialog')).toBeDefined()
    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
    expect(screen.queryByText('Aprobaste Phishing')).toBeNull()
  })

  it('al responder bien las dos preguntas del mini-test, recién ahí aparece la pantalla de transición (issue #229 + #230)', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    await screen.findByText('Pregunta 1 de 2')
    fireEvent.click(screen.getByText(/justo antes de la primera barra/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))

    await screen.findByText('Pregunta 2 de 2')
    fireEvent.click(screen.getByText(/Entro directo por mi app o el sitio oficial/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('Aprobaste Phishing')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Ir a Smishing →' })).toBeDefined()
  })

  it('la pantalla de transición se puede cerrar y deja ver el botón normal de siguiente módulo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    await screen.findByText('Pregunta 1 de 2')
    fireEvent.click(screen.getByText(/justo antes de la primera barra/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))
    await screen.findByText('Pregunta 2 de 2')
    fireEvent.click(screen.getByText(/Entro directo por mi app o el sitio oficial/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir aquí' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
  })

  it('al no aprobar el módulo, no abre la pantalla de transición', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'INCORRECTO' })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="INCORRECTO" /></BrowserRouter>)

    await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('al aprobar el último módulo (sin uno siguiente) no abre la pantalla de transición', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('asistentes-ia').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 4,
      requeridos: 3,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="asistentes-ia/historial-cliente" outcome="CORRECTO" /></BrowserRouter>)

    await screen.findByRole('link', { name: 'Volver al panel →' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renderiza sin errores cuando autoFocus está activado', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <FinalActions
          escenarioId="fisico/salida-segura"
          outcome="CORRECTO"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
          autoFocus={true}
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })
})
