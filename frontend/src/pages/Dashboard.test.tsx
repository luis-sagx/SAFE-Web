import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSectionScenarios } from '../data/catalogo'
import Dashboard from './Dashboard'

const { fetchProgressMock, assessmentStatusMock, susStatusMock } = vi.hoisted(() => ({
  fetchProgressMock: vi.fn(),
  assessmentStatusMock: vi.fn(),
  susStatusMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchProgress: fetchProgressMock, fetchAssessmentStatus: assessmentStatusMock, fetchSusStatus: susStatusMock }
})

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
}

function progressFor(module: string, aprobado: boolean) {
  return {
    modulo: module,
    escenarios: getSectionScenarios(module).map(({ id }) => ({ id })),
    aprobados: aprobado ? 6 : 0,
    requeridos: 6,
    aprobado,
  }
}

describe('Dashboard', () => {
  beforeEach(() => {
    fetchProgressMock.mockReset()
    assessmentStatusMock.mockReset().mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: false, posttestCompleted: false })
    susStatusMock.mockReset().mockResolvedValue({ version: 1, available: true, completed: false })
  })

  it('espera a que se complete la evaluación final antes de ofrecer SUS', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, false)))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: true, pretestCompleted: false, posttestAvailable: true, posttestCompleted: false })
    renderDashboard()
    const link = await screen.findByRole('link', { name: 'Responder evaluación final' })
    expect(link.getAttribute('href')).toBe('/evaluacion-final')
    expect(screen.queryByRole('link', { name: 'Responder encuesta de usabilidad' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
  })

  it('ofrece SUS tras el posttest aunque el progreso local esté incompleto', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve({
      ...progressFor(module, false),
      escenarios: [],
    }))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: true })

    renderDashboard()

    const link = await screen.findByRole('link', { name: 'Responder encuesta de usabilidad' })
    expect(link.getAttribute('href')).toBe('/encuesta-sus')
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
  })

  it('muestra agradecimiento cuando ya respondió la encuesta SUS', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: true })
    susStatusMock.mockResolvedValue({ version: 1, available: true, completed: true })
    renderDashboard()
    expect(await screen.findByText('Tu evaluación final y la encuesta de usabilidad ya están guardadas.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Responder encuesta de usabilidad' })).toBeNull()
    expect(await screen.findByRole('button', { name: 'Descargar certificado' })).toBeDefined()
  })

  // El recorrido propio vive en el menú de cuenta del header, que es el mismo
  // en todas las pantallas: se llega a él desde cualquier punto, no solo aquí.
  it('siempre ofrece el enlace al recorrido propio', async () => {
    fetchProgressMock.mockResolvedValue(progressFor('phishing', false))

    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: /María/ }))
    expect(screen.getByRole('menuitem', { name: 'Tu recorrido' })).toBeDefined()
  })

  it('sin aprobar todos los módulos, no ofrece el certificado', async () => {
    fetchProgressMock.mockResolvedValue(progressFor('phishing', false))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: true })
    susStatusMock.mockResolvedValue({ version: 1, available: true, completed: true })

    renderDashboard()

    // "Tu avance" solo se pinta una vez que al menos un progreso resolvió;
    // es el punto de espera fiable, sin depender de cómo el conteo reparte
    // los números entre varios `<span>`.
    await screen.findByText('Tu avance')
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
    expect(screen.getByText('Tu evaluación final ya está guardada.')).toBeDefined()
    expect(screen.getByText('Tu evaluación final y la encuesta de usabilidad ya están guardadas.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Responder encuesta de usabilidad' })).toBeNull()
  })

  // El botón no depende de un número escrito en el componente: aparece
  // exactamente cuando el servidor ya dio por aprobados todos los módulos que
  // declara (una condición que aquí se simula aprobando los de todas las
  // secciones activas).
  it('con todos los módulos aprobados pero sin posttest, mantiene pendiente el certificado', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: false })

    renderDashboard()

    await screen.findByText('Tu avance')
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
    expect(await screen.findByRole('link', { name: 'Responder evaluación final' })).toBeDefined()
    expect(screen.queryByRole('link', { name: 'Responder encuesta de usabilidad' })).toBeNull()
  })

  it('con módulos, posttest y SUS completados, ofrece descargar el certificado', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: true })
    susStatusMock.mockResolvedValue({ version: 1, available: true, completed: true })

    renderDashboard()

    expect(await screen.findByRole('button', { name: 'Descargar certificado' })).toBeDefined()
  })

  // El sonido de logro ("modulo-completo-sonado") ya no vive aquí: se movió a
  // TransicionFinal.tsx, la pantalla de cierre que aparece justo al aprobar
  // el último módulo — ese es el momento del logro, no cada visita al panel
  // después. Sus pruebas están en TransicionFinal.test.tsx.
})
