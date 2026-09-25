import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminParticipant, RunResult } from '../lib/api'
import Admin from './Admin'

const api = vi.hoisted(() => ({
  changeParticipantStatus: vi.fn(),
  changeTrainerStatus: vi.fn(),
  createTrainer: vi.fn(),
  deleteParticipant: vi.fn(),
  fetchParticipants: vi.fn(),
  fetchResults: vi.fn(),
  fetchTrainers: vi.fn(),
  resetParticipantPassword: vi.fn(),
  resetTrainerPassword: vi.fn(),
}))
const csv = vi.hoisted(() => ({ downloadCsv: vi.fn() }))

vi.mock('../lib/api', () => api)
vi.mock('../lib/resultsCsv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/resultsCsv')>()),
  downloadCsv: csv.downloadCsv,
}))
vi.mock('../components/AppHeader', () => ({ default: () => <header>SAFE-Web</header> }))

const ANA: AdminParticipant = {
  id: 'a1',
  nombre: 'Ana',
  apellido: 'Paz',
  email: 'ana@example.com',
  activo: true,
}

function run(seudonimo: string, scenarioId: string, overrides: Partial<RunResult> = {}): RunResult {
  return {
    seudonimo,
    scenarioId,
    version: 1,
    outcome: 'CORRECTO',
    score: 100,
    endingId: 'fin',
    durationMs: 120000,
    startedAt: '2026-09-01T10:00:00Z',
    finishedAt: '2026-09-01T10:02:00Z',
    ...overrides,
  }
}

async function renderAdmin() {
  render(<Admin />)
  await act(async () => {})
}

async function openTab(name: string) {
  fireEvent.click(screen.getByRole('tab', { name }))
  await act(async () => {})
}

async function confirm(label: string) {
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: label }))
  await act(async () => {})
}

beforeEach(() => {
  vi.clearAllMocks()
  api.fetchParticipants.mockResolvedValue([ANA])
  api.fetchTrainers.mockResolvedValue([])
  api.fetchResults.mockResolvedValue([])
})

describe('Admin · participantes', () => {
  it('muestra nombre y correo, sin seudónimo', async () => {
    await renderAdmin()
    expect(screen.getByText('Ana Paz')).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.queryByText(/Seudónimo/)).toBeNull()
  })

  it('desactivar pide confirmación y actualiza la fila', async () => {
    api.changeParticipantStatus.mockResolvedValue({ ...ANA, activo: false })
    await renderAdmin()
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    await confirm('Sí, desactivar')
    expect(api.changeParticipantStatus).toHaveBeenCalledWith('a1', false)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Desactivada')).toBeDefined()
  })

  it('restablecer muestra la contraseña nueva una vez', async () => {
    api.resetParticipantPassword.mockResolvedValue({ password: 'Nueva-123' })
    await renderAdmin()
    fireEvent.click(screen.getByRole('button', { name: 'Clave' }))
    await confirm('Sí, restablecer')
    expect(screen.getByText('Nueva-123')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Ya la copié, ocultar contraseña' }))
    expect(screen.queryByText('Nueva-123')).toBeNull()
  })

  it('eliminar quita la fila', async () => {
    api.deleteParticipant.mockResolvedValue(undefined)
    await renderAdmin()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await confirm('Sí, eliminar')
    expect(api.deleteParticipant).toHaveBeenCalledWith('a1')
    expect(screen.queryByText('Ana Paz')).toBeNull()
  })
})

describe('Admin · testers', () => {
  it('sin testers muestra el aviso vacío', async () => {
    await renderAdmin()
    await openTab('Testers')
    expect(screen.getByText('Todavía no hay testers creados.')).toBeDefined()
  })

  it('crear tester en el modal muestra la contraseña inicial y recarga la lista', async () => {
    api.createTrainer.mockResolvedValue({ password: 'Inicial-1' })
    await renderAdmin()
    await openTab('Testers')
    fireEvent.click(screen.getByRole('button', { name: 'Crear tester' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nombre'), { target: { value: 'Teo' } })
    fireEvent.change(within(dialog).getByLabelText('Apellido'), { target: { value: 'Ruiz' } })
    fireEvent.change(within(dialog).getByLabelText('Correo'), { target: { value: 'teo@example.com' } })
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement)
    await act(async () => {})

    expect(api.createTrainer).toHaveBeenCalledWith({ nombre: 'Teo', apellido: 'Ruiz', email: 'teo@example.com' })
    expect(screen.getByRole('heading', { name: 'Tester creado' })).toBeDefined()
    expect(screen.getByText('Inicial-1')).toBeDefined()
    expect(api.fetchTrainers).toHaveBeenCalledTimes(2)
  })

  it('un error al crear se muestra dentro del modal', async () => {
    api.createTrainer.mockRejectedValue(new Error('Ese correo ya existe.'))
    await renderAdmin()
    await openTab('Testers')
    fireEvent.click(screen.getByRole('button', { name: 'Crear tester' }))
    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)
    await act(async () => {})
    expect(within(screen.getByRole('dialog')).getByRole('alert').textContent).toBe('Ese correo ya existe.')
  })

  it('activar y restablecer la clave de un tester', async () => {
    const teo = { ...ANA, id: 't1', nombre: 'Teo', activo: false }
    api.fetchTrainers.mockResolvedValue([teo])
    api.changeTrainerStatus.mockResolvedValue({ ...teo, activo: true })
    api.resetTrainerPassword.mockResolvedValue({ password: 'Tester-9' })
    await renderAdmin()
    await openTab('Testers')

    fireEvent.click(screen.getByRole('button', { name: 'Activar' }))
    await confirm('Sí, activar')
    expect(api.changeTrainerStatus).toHaveBeenCalledWith('t1', true)
    expect(screen.getByText('Activa')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Clave' }))
    await confirm('Sí, restablecer')
    expect(api.resetTrainerPassword).toHaveBeenCalledWith('t1')
    expect(screen.getByText('Tester-9')).toBeDefined()
  })
})

describe('Admin · resultados', () => {
  it('sin corridas lo dice', async () => {
    await renderAdmin()
    await openTab('Resultados')
    expect(screen.getByText('Todavía no hay corridas registradas.')).toBeDefined()
  })

  it('un error de carga se muestra', async () => {
    api.fetchResults.mockRejectedValue(new Error('Sin conexión'))
    await renderAdmin()
    await openTab('Resultados')
    expect(screen.getByRole('alert').textContent).toBe('Sin conexión')
  })

  it('agrupa por seudónimo, filtra por módulo y exporta lo visible', async () => {
    api.fetchResults.mockResolvedValue([
      run('P001', 'phishing/x', { durationMs: 60000 }),
      run('P001', 'smishing/y', { outcome: 'INCORRECTO', score: 0 }),
      run('P002', 'phishing/z', { outcome: 'PARCIAL', score: 50 }),
    ])
    await renderAdmin()
    await openTab('Resultados')

    expect(screen.getByText('3 corridas de 2 participantes.', { exact: false })).toBeDefined()
    expect(screen.getByText('1/2 correctas')).toBeDefined()
    expect(screen.getAllByText('Puntaje medio 50')).toHaveLength(2)
    expect(screen.getByText('3 min')).toBeDefined()

    fireEvent.change(screen.getByLabelText('Módulo'), { target: { value: 'phishing' } })
    expect(screen.getByText('2 corridas de 2 participantes.', { exact: false })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    const [filename, content] = csv.downloadCsv.mock.calls[0] as [string, string]
    expect(filename).toMatch(/^resultados-phishing-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(content).toContain('P002')
    expect(content).not.toContain('smishing/y')

    fireEvent.change(screen.getByLabelText('Módulo'), { target: { value: 'vishing' } })
    expect(screen.getByText('No hay corridas en este módulo.')).toBeDefined()
  })
})
