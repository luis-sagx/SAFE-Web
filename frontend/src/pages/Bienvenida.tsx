import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

/**
 * Aparece sola en el primer ingreso (RequireAuth la fuerza mientras
 * `onboardingVisto` sea false) y queda disponible siempre desde el ícono ⓘ.
 * Se muestra como un modal —una tarjeta centrada, sin el header ni la
 * navegación de la app— para que se lea como un aviso puntual y no como una
 * pantalla más del curso.
 */
function Bienvenida() {
  const { displayName, participant, marcarOnboardingVisto } = useAuth()
  const navigate = useNavigate()

  // Refleja el estado actual al entrar por el ícono ⓘ: si ya lo había
  // marcado, sigue marcado, y desmarcarlo es lo que reactiva el aviso.
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(participant?.onboardingVisto ?? false)
  const [enviando, setEnviando] = useState(false)

  async function handleContinuar(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)

    try {
      await marcarOnboardingVisto(noVolverAMostrar)
    } catch {
      // Informativo, no bloqueante: si falla el guardado, la única
      // consecuencia es que esta pantalla vuelva a aparecer la próxima vez.
    } finally {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink/40 px-6 py-10">
      <div className="w-full max-w-md rounded-xl border border-hairline-strong bg-surface p-7 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          SAFE Web
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>

        <p className="mt-3 text-base leading-relaxed text-body">
          Vas a enfrentar situaciones simuladas de fraude —correos, mensajes, llamadas— y al final
          te decimos qué señales había. Por ahora está disponible{' '}
          <strong className="font-semibold text-ink">Phishing</strong>; el resto llega pronto.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Tu cédula no se guarda, solo evita cuentas repetidas. El resto de tus datos se borra
          cuando el estudio termina.
        </p>

        <form onSubmit={handleContinuar} className="mt-6">
          <label className="flex items-start gap-2.5 text-sm text-body">
            <input
              type="checkbox"
              checked={noVolverAMostrar}
              onChange={(event) => setNoVolverAMostrar(event.target.checked)}
              className="mt-0.5 size-4 shrink-0"
            />
            No volver a mostrar esto al entrar. Lo reabres desde el ícono ⓘ.
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="mt-5 h-11 w-full rounded-md bg-primary text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
          >
            {enviando ? 'Un momento…' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Bienvenida
