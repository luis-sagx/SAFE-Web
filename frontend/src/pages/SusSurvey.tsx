import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/PantallaCarga'
import { fetchSusStatus, submitSusSurvey, type SusStatus } from '../lib/api'

const STATEMENTS = [
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

const OPTIONS = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Ni de acuerdo ni en desacuerdo',
  'De acuerdo',
  'Totalmente de acuerdo',
]

export default function SusSurvey() {
  const { participant } = useAuth()
  const [status, setStatus] = useState<SusStatus | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (participant?.role !== 'PARTICIPANT') return
    let cancelled = false
    fetchSusStatus().then(
      (result) => { if (!cancelled) setStatus(result) },
      () => { if (!cancelled) setLoadError(true) },
    )
    return () => { cancelled = true }
  }, [participant?.role, participant?.id, retry])

  if (participant?.role !== 'PARTICIPANT') return <Navigate to="/dashboard" replace />
  if (loadError) return <main className="mx-auto max-w-2xl px-6 py-12"><p role="alert" className="text-danger">No pudimos cargar la encuesta.</p><button className="mt-4 min-h-11 rounded-md border border-control px-4 text-ink" onClick={() => { setLoadError(false); setRetry((value) => value + 1) }}>Reintentar</button></main>
  if (!status) return <LoadingScreen />
  if (!status.available) return <Navigate to="/dashboard" replace />
  if (status.completed) return <main className="mx-auto max-w-3xl space-y-6 px-6 py-12"><h1 className="text-3xl font-semibold tracking-tight text-ink">Encuesta de usabilidad de SAFE-Web: Escala SUS</h1><p role="status" className="text-base leading-relaxed text-body">Gracias por responder la encuesta de usabilidad.</p><Link to="/dashboard" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-base font-medium text-on-primary hover:bg-primary-active">Volver al panel</Link></main>

  const surveyVersion = status.version
  const ready = STATEMENTS.every((_, index) => answers[index] !== undefined)

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || submitting) return
    setError('')
    setSubmitting(true)
    try {
      const saved = await submitSusSurvey({ version: surveyVersion, answers: STATEMENTS.map((_, index) => answers[index]!) })
      setStatus(saved)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos guardar tus respuestas. Reintenta.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Encuesta de usabilidad de SAFE-Web: Escala SUS</h1>
      <p className="text-base leading-relaxed text-body">Esta encuesta tiene como objetivo evaluar qué tan fácil resulta utilizar SAFE-Web. Responde cada afirmación pensando en tu experiencia con la plataforma y selecciona una opción según tu grado de acuerdo:</p>
      <p className="text-base leading-relaxed text-body">No hay respuestas correctas o incorrectas. Tus opiniones nos ayudarán a mejorar SAFE-Web y no afectarán tus resultados ni la obtención del certificado.</p>
      <p className="text-sm text-body">Selecciona una opción del 1 al 5 para cada afirmación. Todos los campos son obligatorios.</p>
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        {STATEMENTS.map((statement, index) => (
          <fieldset key={statement} aria-labelledby={`sus-question-${index + 1}`} className="min-w-0 rounded-lg border border-hairline-strong bg-surface p-5" disabled={submitting}>
            <p id={`sus-question-${index + 1}`} className="mb-4 break-words text-lg font-semibold text-ink">{index + 1}. {statement}</p>
            <div className="space-y-2">
              {OPTIONS.map((option, optionIndex) => (
                <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-control px-3 py-2 text-base text-body focus-within:outline-2 focus-within:outline-primary">
                  <input type="radio" name={`sus-question-${index}`} value={optionIndex + 1} checked={answers[index] === optionIndex + 1} onChange={() => setAnswers((previous) => ({ ...previous, [index]: optionIndex + 1 }))} required className="size-4 shrink-0 accent-primary" />
                  <span className="font-medium text-ink">{optionIndex + 1}</span> {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <p role="status" className="text-sm text-body">{Object.keys(answers).length} de {STATEMENTS.length} preguntas respondidas. Todos los campos son obligatorios.</p>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button type="submit" disabled={!ready || submitting} className="min-h-11 rounded-md bg-primary px-5 text-base font-medium text-on-primary hover:bg-primary-active disabled:opacity-60">{submitting ? 'Guardando…' : 'Enviar encuesta'}</button>
      </form>
    </main>
  )
}
