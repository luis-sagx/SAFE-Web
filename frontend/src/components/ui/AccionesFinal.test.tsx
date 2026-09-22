import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FinalActions from './AccionesFinal'
import { getSectionScenarios } from '../../data/catalogo'

const { fetchProgressMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
}))

vi.mock('../../lib/api', async () => {
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, fetchProgress: fetchProgressMock }
})

// FinalTransition (pantalla de cierre del entrenamiento completo) renderiza
// CertificateButton, que necesita el contexto de autenticación.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())

describe('AccionesFinal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchProgressMock.mockReset()
  })

  it('no ofrece repetir el módulo desde el cierre de un escenario', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    render(
      <MemoryRouter initialEntries={['/seccion/fisico/salida-segura']}>
        <Routes>
          <Route path="/seccion/fisico/salida-segura" element={<FinalActions escenarioId="fisico/salida-segura" outcome="CORRECTO" />} />
          <Route path="/seccion/fisico" element={<p>Sección reiniciada</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText((_, element) => element?.tagName === 'P' && element.textContent?.startsWith('Llevas') === true)
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
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

  it('al aprobar el módulo permite avanzar sin ofrecer reiniciarlo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    await screen.findByRole('dialog')
    expect(screen.getByRole('link', { name: 'Ir al siguiente módulo →' }).getAttribute('href')).toBe('/seccion/smishing')
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
  })

  it('al no aprobar mantiene la opción de avanzar sin repetir el módulo', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('phishing').map(({ id }) => ({ id, ultimoOutcome: 'INCORRECTO' })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="phishing/sesion-bogota" outcome="INCORRECTO" /></BrowserRouter>)

    await screen.findByText((_, element) => element?.tagName === 'P' && element.textContent?.startsWith('Llevas') === true)
    expect(screen.getByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
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
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
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

  // Issue: no había ningún remate especial al terminar TODO el entrenamiento,
  // solo este link liso — mismo trato que un módulo cualquiera a medio
  // terminar. Si los otros 6 módulos también están aprobados, ahora aparece
  // la pantalla de cierre con trofeo y las acciones de certificado/insignia.
  it('al terminar el último módulo con los otros 6 ya aprobados, celebra el cierre del entrenamiento', async () => {
    fetchProgressMock.mockResolvedValue({
      escenarios: getSectionScenarios('asistentes-ia').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 4,
      requeridos: 3,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><FinalActions escenarioId="asistentes-ia/historial-cliente" outcome="CORRECTO" /></BrowserRouter>)

    expect(await screen.findByText('Completaste todo el entrenamiento')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Ir al panel →' }).getAttribute('href')).toBe('/dashboard')
  })

  it('al terminar el último módulo sin que los demás estén aprobados todavía, no celebra el cierre', async () => {
    fetchProgressMock.mockImplementation((sectionId: string) =>
      Promise.resolve({
        modulo: sectionId,
        escenarios: getSectionScenarios(sectionId).map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
        aprobados: sectionId === 'asistentes-ia' ? 4 : 0,
        requeridos: sectionId === 'asistentes-ia' ? 3 : 6,
        aprobado: sectionId === 'asistentes-ia',
        ronda: 1,
        rondaEnCurso: null,
      }),
    )

    render(<BrowserRouter><FinalActions escenarioId="asistentes-ia/historial-cliente" outcome="CORRECTO" /></BrowserRouter>)

    expect((await screen.findByRole('link', { name: 'Volver al panel →' })).getAttribute('href')).toBe('/dashboard')
    expect(screen.queryByText('Completaste todo el entrenamiento')).toBeNull()
  })

  it('renderiza sin errores cuando no hay progreso', async () => {
    fetchProgressMock.mockRejectedValue(new Error('sin red'))

    const { container } = render(
      <BrowserRouter>
        <FinalActions
          escenarioId="fisico/salida-segura"
          outcome="CORRECTO"
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

  it('al aprobar el último módulo (sin uno siguiente) no abre la pantalla de transición de "sigue otro módulo"', async () => {
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
    // Sí puede abrir la pantalla de cierre del entrenamiento completo (otro
    // componente, ver el test de arriba); lo que no debe aparecer es la de
    // "Aprobaste X, sigue Y", que no tiene sentido sin un módulo siguiente.
    expect(screen.queryByText(/^Aprobaste /)).toBeNull()
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
          autoFocus={true}
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })
})
