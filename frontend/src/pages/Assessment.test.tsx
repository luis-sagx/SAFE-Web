import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Assessment from './Assessment'

const { status, questionnaire, submit } = vi.hoisted(() => ({ status: vi.fn(), questionnaire: vi.fn(), submit: vi.fn() }))
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
  for (let index = 1; index <= 21; index++) fireEvent.click(within(screen.getByRole('group', { name: `${index}. Situación ${index}` })).getByLabelText('Consultar'))
}
describe('Assessment', () => {
  beforeEach(() => {
    status.mockReset().mockResolvedValue(initial)
    questionnaire.mockReset().mockResolvedValue(survey)
    submit.mockReset().mockResolvedValue({ ...initial, pretestRequired: false, pretestCompleted: true })
  })
  it('exige todas las respuestas y consentimiento antes de guardar', async () => {
    mount()
    const button = await screen.findByRole('button', { name: 'Enviar evaluación' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await fill()
    expect((button as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }))
    expect((button as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(button)
    expect(await screen.findByText('Bienvenida')).toBeDefined()
    expect(submit).toHaveBeenCalledWith({ phase: 'PRE', version: 1, ageRange: '18 - 29 años', gender: 'Prefiero no decirlo', answers: Array(21).fill(0), consentAccepted: true, consentVersion: '2026-10-14' })
  })
  it('conserva respuestas al fallar el envío y permite reintentar sin dar correcciones', async () => {
    submit.mockRejectedValueOnce(new Error('No se pudo guardar.'))
    mount()
    await fill()
    fireEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByRole('alert')).toBeDefined()
    expect((screen.getByLabelText('18 - 29 años') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByText('Bienvenida')).toBeDefined()
  })
  it('no muestra el posttest antes de terminar todos los escenarios', async () => {
    status.mockResolvedValue({ ...initial, pretestRequired: false, pretestCompleted: true })
    mount('POST')
    await waitFor(() => expect(screen.getByText('Entrenamiento')).toBeDefined())
    expect(screen.queryByRole('radio')).toBeNull()
  })
  it('permite evaluación final sin medición inicial y explica que no será un par', async () => {
    status.mockResolvedValue({ ...initial, pretestRequired: false, baselineMissing: true, posttestAvailable: true })
    mount('POST')
    expect(await screen.findByText(/sin medición inicial/)).toBeDefined()
    await fill()
    fireEvent.click(screen.getByRole('checkbox', { name: /Acepto/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar evaluación' }))
    expect(await screen.findByText('Entrenamiento')).toBeDefined()
  })
})
