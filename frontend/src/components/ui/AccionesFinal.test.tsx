import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccionesFinal from './AccionesFinal'
import { escenariosDeSeccion } from '../../data/catalogo'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

describe('AccionesFinal', () => {
  const mockOnRestart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    fetchProgresoMock.mockReset()
  })

  it('renderiza sin errores cuando hay progreso', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
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
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura', ultimoOutcome: 'CORRECTO' }],
      aprobados: 1,
      requeridos: 5,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })
    render(<BrowserRouter><AccionesFinal escenarioId="fisico/salida-segura" outcome="CORRECTO" /></BrowserRouter>)
    expect((await screen.findByRole('link', { name: 'Siguiente escenario →' })).getAttribute('href')).toBe(
      '/seccion/fisico/trampa-usb',
    )
  })

  it('al aprobar el módulo lleva al siguiente módulo y no ofrece repetir', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 6,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><AccionesFinal escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    expect((await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).getAttribute('href')).toBe('/seccion/smishing')
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
  })

  it('al no aprobar mantiene la opción de repetir además de avanzar', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('phishing').map(({ id }) => ({ id, ultimoOutcome: 'INCORRECTO' })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><AccionesFinal escenarioId="phishing/sesion-bogota" outcome="INCORRECTO" /></BrowserRouter>)

    expect(await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Repetir el módulo' })).toBeDefined()
  })

  it('calcula la nota final con el resultado que aún se está guardando', async () => {
    const escenariosPrevios = escenariosDeSeccion('phishing').filter(({ id }) => id !== 'phishing/sesion-bogota')
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosPrevios.map(({ id }, indice) => ({
        id,
        ultimoOutcome: indice < 5 ? 'CORRECTO' : 'INCORRECTO',
      })),
      aprobados: 5,
      requeridos: 6,
      aprobado: false,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><AccionesFinal escenarioId="phishing/sesion-bogota" outcome="CORRECTO" /></BrowserRouter>)

    expect(await screen.findByRole('link', { name: 'Ir al siguiente módulo →' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Repetir el módulo' })).toBeNull()
  })

  it('continúa la repetición cuando el primer resultado todavía no llegó al servidor', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 8,
      requeridos: 6,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/seccion/phishing/loteria-premiada', state: { iniciarRepeticion: true } }]}>
        <AccionesFinal escenarioId="phishing/loteria-premiada" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    await screen.findByText(
      (_, elemento) => elemento?.textContent === 'Llevas 1 de los 6 que necesitas para aprobar el módulo.',
    )
    expect(screen.getByRole('link', { name: 'Siguiente escenario →' }).getAttribute('href')).toBe('/seccion/phishing/factura-sri')
  })

  it('conserva todos los escenarios provisionales al avanzar una repetición', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
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
        <AccionesFinal escenarioId="phishing/factura-sri" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    await screen.findByText(
      (_, elemento) => elemento?.textContent === 'Llevas 2 de los 6 que necesitas para aprobar el módulo.',
    )
    expect(screen.getByRole('link', { name: 'Siguiente escenario →' }).getAttribute('href')).toBe('/seccion/phishing/clave-caducada')
  })

  it('conserva el resultado incorrecto de intentos provisionales', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('phishing').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
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
        <AccionesFinal escenarioId="phishing/factura-sri" outcome="CORRECTO" />
      </MemoryRouter>,
    )

    expect(await screen.findByText(
      (_, elemento) => elemento?.textContent === 'Llevas 1 de los 6 que necesitas para aprobar el módulo.',
    )).toBeDefined()
  })

  it('lleva al panel al terminar el último módulo', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: escenariosDeSeccion('fisico').map(({ id }) => ({ id, ultimoOutcome: 'CORRECTO' })),
      aprobados: 8,
      requeridos: 5,
      aprobado: true,
      ronda: 1,
      rondaEnCurso: null,
    })

    render(<BrowserRouter><AccionesFinal escenarioId="fisico/qr-cafe-wifi" outcome="CORRECTO" /></BrowserRouter>)

    expect((await screen.findByRole('link', { name: 'Volver al panel →' })).getAttribute('href')).toBe('/dashboard')
  })

  it('renderiza sin errores cuando no hay progreso', async () => {
    fetchProgresoMock.mockRejectedValue(new Error('sin red'))

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
          escenarioId="fisico/salida-segura"
          outcome="CORRECTO"
          onRestart={mockOnRestart}
          restartLabel="Repetir"
        />
      </BrowserRouter>
    )

    expect(container).toBeDefined()
  })

  it('renderiza sin errores cuando autoFocus está activado', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { container } = render(
      <BrowserRouter>
        <AccionesFinal
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
