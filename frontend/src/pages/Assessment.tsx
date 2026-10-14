import { useEffect, useState, type SyntheticEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/PantallaCarga'
import { fetchAssessmentStatus, fetchQuestionnaire, submitAssessment, type AssessmentStatus, type Questionnaire } from '../lib/api'

function RadioGroup({ name, title, options, value, onChange, disabled }: {
  name: string; title: string; options: string[]; value: number | undefined
  onChange: (value: number) => void; disabled: boolean
}) {
  return (
    <fieldset aria-labelledby={`${name}-title`} className="min-w-0 rounded-lg border border-hairline-strong bg-surface p-5" disabled={disabled}>
      <p id={`${name}-title`} className="mb-4 break-words text-lg font-semibold text-ink">{title}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-control px-3 py-2 text-base text-body focus-within:outline-2 focus-within:outline-primary">
            <input type="radio" name={name} value={index} checked={value === index} onChange={() => onChange(index)} required className="size-4 shrink-0 appearance-none rounded-full border border-primary bg-clip-content p-[3px] checked:bg-primary focus:outline-none" />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function Assessment({ phase }: { phase: 'PRE' | 'POST' }) {
  const { participant } = useAuth()
  return <AssessmentForm key={`${participant?.id}-${phase}`} phase={phase} />
}

function AssessmentForm({ phase }: { phase: 'PRE' | 'POST' }) {
  const { participant } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<{ status: AssessmentStatus; questionnaire: Questionnaire } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [ageIndex, setAgeIndex] = useState<number>()
  const [genderIndex, setGenderIndex] = useState<number>()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (participant?.role !== 'PARTICIPANT') return
    let cancelled = false
    Promise.all([fetchAssessmentStatus(), fetchQuestionnaire()]).then(
      ([status, questionnaire]) => { if (!cancelled) setLoaded({ status, questionnaire }) },
      () => { if (!cancelled) setLoadError(true) },
    )
    return () => { cancelled = true }
  }, [phase, retry, participant?.role])

  if (participant?.role !== 'PARTICIPANT') return <Navigate to="/dashboard" replace />
  if (loadError) return <main className="mx-auto max-w-2xl px-6 py-12"><p role="alert" className="text-danger">No pudimos cargar la evaluación.</p><button className="mt-4 min-h-11 rounded-md border border-control px-4 text-ink" onClick={() => { setLoadError(false); setRetry((value) => value + 1) }}>Reintentar</button></main>
  if (!loaded) return <LoadingScreen />
  const { status, questionnaire } = loaded
  if (phase === 'PRE' && !status.pretestRequired) return <Navigate to="/dashboard" replace />
  if (phase === 'POST' && (!status.posttestAvailable || status.posttestCompleted)) return <Navigate to="/dashboard" replace />
  const ready = ageIndex !== undefined && genderIndex !== undefined && questionnaire.questions.every((question) => answers[question.id] !== undefined)

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || submitting || ageIndex === undefined || genderIndex === undefined) return
    setError('')
    setSubmitting(true)
    try {
      await submitAssessment({
        phase, version: questionnaire.version,
        ageRange: questionnaire.ageRanges[ageIndex]!, gender: questionnaire.genders[genderIndex]!,
        answers: questionnaire.questions.map((question) => answers[question.id]!),
      })
      navigate(phase === 'PRE' ? '/bienvenida' : '/dashboard', { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos guardar tu evaluación. Reintenta.')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{phase === 'PRE' ? 'Evaluación inicial' : 'Evaluación final'}</h1>
      <p className="text-base leading-relaxed text-body">{phase === 'PRE' ? 'Antes de empezar, responde qué harías en estas situaciones.' : 'Gracias por completar los escenarios. Para cerrar tu participación en el estudio, responde qué harías ahora en estas situaciones.'} Elige una respuesta por pregunta. Si tienes dudas, puedes indicar «No estoy seguro/a».</p>
      <p className="text-base leading-relaxed text-body">Tus respuestas se guardan con un identificador confidencial, sin incluir tu nombre, correo ni cédula. Usamos el mismo identificador para comparar ambas evaluaciones. No mostraremos respuestas correctas ni puntajes durante esta encuesta.</p>
      <p className="text-sm text-body">Las respuestas se guardan al enviar la evaluación. Si sales antes de enviarla, tendrás que responderla nuevamente.</p>
      <form onSubmit={(event) => void submit(event)} className="space-y-6">
        <RadioGroup name="ageRange" title="Rango de edad" options={questionnaire.ageRanges} value={ageIndex} onChange={setAgeIndex} disabled={submitting} />
        <RadioGroup name="gender" title="Género" options={questionnaire.genders} value={genderIndex} onChange={setGenderIndex} disabled={submitting} />
        {questionnaire.questions.map((question) => <RadioGroup key={question.id} name={`question-${question.id}`} title={`${question.id}. ${question.prompt}`} options={question.options} value={answers[question.id]} onChange={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))} disabled={submitting} />)}
        <p role="status" className="text-sm text-body">{Object.keys(answers).length} de {questionnaire.questions.length} preguntas respondidas. Todos los campos son obligatorios.</p>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button type="submit" disabled={!ready || submitting} className="min-h-11 rounded-md bg-primary px-5 text-base font-medium text-on-primary hover:bg-primary-active disabled:opacity-60">{submitting ? 'Guardando…' : 'Enviar evaluación'}</button>
      </form>
    </main>
  )
}
