import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Assessment from './Assessment'

const { status, questionnaire, submit, navigationFailure } = vi.hoisted(() => ({ status: vi.fn(), questionnaire: vi.fn(), submit: vi.fn(), navigationFailure: vi.fn() }))
vi.mock('react-router', async () => {
  const router = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...router, useNavigate: () => {
    const navigate = router.useNavigate()
    return (...args: Parameters<typeof navigate>) => {
      const failure: Error | undefined = navigationFailure()
      if (!failure) return navigate(...args)
      const rejected = Promise.reject(failure)
      // La prueba observa el error en la interfaz, sin emitir un rechazo global.
      void rejected.catch(() => {})
      return rejected
    }
  } }
})
vi.mock('../lib/api', async () => ({
  ...await vi.importActual<typeof import('../lib/api')>('../lib/api'),
  fetchAssessmentStatus: status, fetchQuestionnaire: questionnaire, submitAssessment: submit,
}))
vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())
const initial = { pretestRequired: true, baselineMissing: false, pretestCompleted: false, posttestAvailable: false, posttestCompleted: false }
const survey = { version: 1, ageRanges: ['18 - 29 años'], genders: ['Prefiero no decirlo'], questions: Array.from({ length: 21 }, (_, index) => ({ id: index + 1, prompt: `Situación ${index + 1}`, options: ['Consultar', 'Enviar', 'Esperar', 'No estoy seguro/a.'] })) }
function mount(phase: 'PRE' | 'POST' = 'PRE') {
  render(<MemoryRouter><Routes><Route path="/" element={<Assessment phase={phase} />} /><Route path="/dashboard" element={<p>Entrenamiento</p>} /><Route path="/bienvenida" element={<p>Bienvenida</p>} /></Routes></MemoryRouter>)
}
async function fill() {
  await screen.findByRole('group', { name: /Rango de edad/ })
  fireEvent.click(screen.getByLabelText('18 - 29 años'))
  fireEvent.click(screen.getByLabelText('Prefiero no decirlo'))
  for (const group of screen.getAllByRole('group').slice(2)) fireEvent.click(within(group).getByLabelText('Consultar'))
}
describe('Assessment', () => {
  beforeEach(() => {
    status.mockReset().mockResolvedValue(initial)
    questionnaire.mockReset().mockResolvedValue(survey)
    submit.mockReset().mockResolvedValue({ ...initial, pretestRequired: false, pretestCompleted: true })
    navigationFailure.mockReset()
  })
  it('exige todas las respuestas y envía sin pedir otra aceptación', async () => {
    mount()
    const button = await screen.findByRole('button', { name: 'Enviar evaluación' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await fill()
    expect(screen.getByRole('group', { name: '21. Situación 21' })).toBeDefined()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect((button as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(button)
    expect(await screen.findByText('Bienvenida')).toBeDefined()
    expect(submit).toHaveBeenCalledWith({ phase: 'PRE', version: 1, ageRange: '18 - 29 años', gender: 'Prefiero no decirlo', answers: Array(21).fill(0) })
  })
  it('conserva respuestas al fallar el envío y permite reintentar sin dar correcciones', async () => {
    submit.mockRejectedValueOnce(new Error('No se pudo guardar.'))
    mount()
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByRole('alert')).toBeDefined()
    expect((screen.getByLabelText('18 - 29 años') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByText('Bienvenida')).toBeDefined()
  })
  it('recupera el formulario si falla la navegación después de guardar', async () => {
    navigationFailure.mockReturnValueOnce(new Error('No se pudo abrir la siguiente página.'))
    mount()
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect((await screen.findByRole('alert')).textContent).toBe('No se pudo abrir la siguiente página.')
    expect((screen.getByLabelText('18 - 29 años') as HTMLInputElement).checked).toBe(true)
    expect((within(screen.getByRole('group', { name: '1. Situación 1' })).getByLabelText('Consultar') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('button', { name: 'Enviar evaluación' }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByText('Bienvenida')).toBeDefined()
  })
  it('no muestra el posttest antes de terminar todos los escenarios', async () => {
    status.mockResolvedValue({ ...initial, pretestRequired: false, pretestCompleted: true })
    mount('POST')
    await waitFor(() => expect(screen.getByText('Entrenamiento')).toBeDefined())
    expect(screen.queryByRole('radio')).toBeNull()
  })
  it('permite evaluación final sin medición inicial sin mostrar el aviso técnico', async () => {
    status.mockResolvedValue({ ...initial, pretestRequired: false, baselineMissing: true, posttestAvailable: true })
    mount('POST')
    await fill()
    expect(screen.queryByText(/sin medición inicial/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByText('Entrenamiento')).toBeDefined()
  })
})
