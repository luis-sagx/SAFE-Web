import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SusSurvey from './SusSurvey'

const { fetchStatus, submit } = vi.hoisted(() => ({ fetchStatus: vi.fn(), submit: vi.fn() }))
vi.mock('../lib/api', async () => ({
  ...await vi.importActual<typeof import('../lib/api')>('../lib/api'),
  fetchSusStatus: fetchStatus,
  submitSusSurvey: submit,
}))
vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

const statements = [
  'Me gustaría utilizar SAFE-Web con frecuencia.',
  'Percibí una complejidad innecesaria al utilizar SAFE-Web.',
  'Usar SAFE-Web me resultó sencillo.',
  'Necesitaría ayuda de alguien con conocimientos técnicos para utilizar SAFE-Web.',
  'Las distintas funciones de SAFE-Web funcionan bien en conjunto.',
  'Encontré inconsistencias entre las distintas partes de SAFE-Web.',
  'Creo que la mayoría de las personas aprendería rápidamente a utilizar SAFE-Web.',
  'Utilizar SAFE-Web me resultó complicado.',
  'Sentí confianza al utilizar SAFE-Web.',
  'Tuve que aprender muchas cosas antes de poder utilizar SAFE-Web.',
]

function mount() {
  render(<MemoryRouter initialEntries={['/encuesta-sus']}><Routes>
    <Route path="/encuesta-sus" element={<SusSurvey />} />
    <Route path="/dashboard" element={<p>Entrenamiento</p>} />
  </Routes></MemoryRouter>)
}

async function answerAll() {
  await screen.findByRole('heading', { name: 'Encuesta de usabilidad de SAFE-Web: Escala SUS' })
  for (let index = 0; index < statements.length; index++) {
    const group = screen.getByRole('group', { name: `${index + 1}. ${statements[index]}` })
    fireEvent.click(within(group).getByLabelText('5 Totalmente de acuerdo'))
  }
}

describe('SusSurvey', () => {
  beforeEach(() => {
    fetchStatus.mockReset().mockResolvedValue({ version: 1, available: true, completed: false })
    submit.mockReset().mockResolvedValue({ version: 1, available: true, completed: true })
  })

  it('presenta las diez afirmaciones obligatorias y la escala SUS', async () => {
    mount()
    const submitButton = await screen.findByRole('button', { name: 'Enviar encuesta' })
    expect((submitButton as HTMLButtonElement).disabled).toBe(true)
    await answerAll()
    expect(screen.getByText('Esta encuesta tiene como objetivo evaluar qué tan fácil resulta utilizar SAFE-Web. Responde cada afirmación pensando en tu experiencia con la plataforma y selecciona una opción según tu grado de acuerdo:')).toBeDefined()
    expect(screen.getByText('No hay respuestas correctas o incorrectas. Tus opiniones nos ayudarán a mejorar SAFE-Web y no afectarán tus resultados ni la obtención del certificado.')).toBeDefined()
    expect(screen.getAllByRole('group')).toHaveLength(10)
    expect((submitButton as HTMLButtonElement).disabled).toBe(false)
  })

  it('mantiene el texto de cada pregunta dentro del panel del grupo accesible', async () => {
    mount()
    const group = await screen.findByRole('group', { name: `1. ${statements[0]}` })
    const question = within(group).getByText(`1. ${statements[0]}`)
    expect(question.tagName).toBe('P')
    expect(question.parentElement).toBe(group)
  })

  it('mantiene las respuestas al fallar y solo completa tras un envío exitoso', async () => {
    submit.mockRejectedValueOnce(new Error('No se pudo guardar.'))
    mount()
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }))
    expect((await screen.findByRole('alert')).textContent).toBe('No se pudo guardar.')
    expect(screen.queryByText('Gracias por responder la encuesta de usabilidad.')).toBeNull()
    expect((within(screen.getByRole('group', { name: `1. ${statements[0]}` })).getByLabelText('5 Totalmente de acuerdo') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar encuesta' }))
    expect(await screen.findByText('Gracias por responder la encuesta de usabilidad.')).toBeDefined()
    expect(submit).toHaveBeenLastCalledWith({ version: 1, answers: Array(10).fill(5) })
    fireEvent.click(screen.getByRole('link', { name: 'Volver al panel' }))
    expect(await screen.findByText('Entrenamiento')).toBeDefined()
  })

  it('redirige si la encuesta todavía no está disponible', async () => {
    fetchStatus.mockResolvedValue({ version: 1, available: false, completed: false })
    mount()
    expect(await screen.findByText('Entrenamiento')).toBeDefined()
  })
})
