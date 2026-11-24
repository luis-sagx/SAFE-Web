import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSectionScenarios, SECTIONS } from '../data/catalogo'
import { setToken } from '../lib/api'
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

function mockPdfDownload() {
  const createObjectURL = vi.fn(() => 'blob:certificado')
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = createObjectURL
    static revokeObjectURL = vi.fn()
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  return createObjectURL
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
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({ estado: 'sin-emitir', modulos: [] }),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

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

  it.each([
    { estado: 'sin-emitir', modulos: [] },
    { estado: 'vigente', modulos: ['phishing'] },
  ])('emite o amplía el certificado ($estado) al aprobar todo el recorrido', async (status) => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ pretestRequired: false, baselineMissing: false, pretestCompleted: true, posttestAvailable: true, posttestCompleted: true })
    susStatusMock.mockResolvedValue({ version: 1, available: true, completed: true })

    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(Response.json(status))
      .mockResolvedValueOnce(Response.json({ atestacion: 'un.jwt.firmado' }))
      .mockResolvedValueOnce(Response.json({ modulos: SECTIONS.map(({ id }) => id) }))
      .mockImplementation(async () => new Response('%PDF-'))
    const createUrl = mockPdfDownload()
    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: 'Descargar certificado' }))
    await screen.findByRole('button', { name: 'Descargar certificado' })
    expect(fetchMock.mock.calls.map(([path, options]) => [path, options?.method])).toEqual([
      ['/api/certificados/me', 'GET'],
      ['/api/runs/atestacion', 'GET'],
      ['/api/certificados', 'POST'],
      ['/api/certificados/pdf', 'POST'],
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))
    await waitFor(() => expect(createUrl).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/certificados/pdf', expect.objectContaining({ method: 'GET' }))
  })

  it('durante una repetición descarga el certificado vigente sin emitirlo de nuevo', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, module !== 'phishing')))
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(Response.json({ estado: 'vigente', modulos: SECTIONS.map(({ id }) => id) }))
      .mockResolvedValueOnce(new Response('%PDF-'))
    const createUrl = mockPdfDownload()
    setToken('token')

    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Descargar certificado' }))

    await waitFor(() => expect(createUrl).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/certificados/pdf', expect.objectContaining({
      method: 'GET',
      body: undefined,
      headers: { Authorization: 'Bearer token' },
    }))
  })

  it('mantiene la descarga si el progreso cambia justo antes de ampliar el certificado', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ posttestCompleted: true })
    susStatusMock.mockResolvedValue({ completed: true })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(Response.json({ estado: 'vigente', modulos: ['phishing'] }))
      .mockResolvedValueOnce(Response.json({}, { status: 409 }))
      .mockResolvedValueOnce(new Response('%PDF-'))
    const createUrl = mockPdfDownload()

    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Descargar certificado' }))

    await waitFor(() => expect(createUrl).toHaveBeenCalledOnce())
    expect(fetchMock.mock.calls.map(([path, options]) => [path, options?.method])).toEqual([
      ['/api/certificados/me', 'GET'],
      ['/api/runs/atestacion', 'GET'],
      ['/api/certificados/pdf', 'GET'],
    ])
  })

  it('no ofrece descargar un certificado revocado aunque se haya aprobado todo', async () => {
    fetchProgressMock.mockImplementation((module: string) => Promise.resolve(progressFor(module, true)))
    assessmentStatusMock.mockResolvedValue({ posttestCompleted: true })
    susStatusMock.mockResolvedValue({ completed: true })
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ estado: 'revocado', modulos: [] }))

    renderDashboard()

    await screen.findByText('Gracias por completar el estudio')
    expect(screen.queryByRole('button', { name: 'Descargar certificado' })).toBeNull()
  })

  it('permite volver a consultar el certificado tras un error de red', async () => {
    fetchProgressMock.mockResolvedValue(progressFor('phishing', false))
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('falla de red'))
      .mockResolvedValueOnce(Response.json({ estado: 'vigente', modulos: ['phishing'] }))

    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar consulta del certificado' }))

    expect(await screen.findByRole('button', { name: 'Descargar certificado' })).toBeDefined()
  })

  // El sonido de logro ("modulo-completo-sonado") ya no vive aquí: se movió a
  // TransicionFinal.tsx, la pantalla de cierre que aparece justo al aprobar
  // el último módulo — ese es el momento del logro, no cada visita al panel
  // después. Sus pruebas están en TransicionFinal.test.tsx.
})
