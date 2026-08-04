import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import AppHeader from '../components/AppHeader'
import InfoLink from '../components/InfoLink'
import { useAuth } from '../context/AuthContext'
import { escenariosDeSeccion, SECCIONES } from '../data/catalogo'

/**
 * Aparece sola en el primer ingreso (RequireAuth la fuerza mientras
 * `onboardingVisto` sea false) y queda disponible siempre desde el ícono ⓘ.
 * No repite el diseño de escenario (sin marco de dispositivo): esto es parte
 * de "lo que rodea al escenario", en modo claro y con los tokens del sistema.
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
    <div className="min-h-screen bg-canvas">
      <AppHeader>
        <span className="text-sm font-semibold text-ink">SAFE Web</span>
        <InfoLink />
      </AppHeader>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
          Antes de empezar
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Hola, {displayName}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-body">
          Vas a practicar seis tipos de engaño que circulan en Ecuador. Cada uno recrea una
          situación de todos los días —un correo, un mensaje, una llamada— y al final te mostramos
          qué señales había, las hayas visto o no.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECCIONES.map((seccion) => {
            const disponible = escenariosDeSeccion(seccion.id).length > 0
            const Icono = seccion.Icono

            return (
              <div
                key={seccion.id}
                className={`rounded-lg border border-hairline-strong p-4 ${disponible ? 'bg-surface' : 'bg-canvas-soft'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-md bg-surface-strong ${disponible ? 'text-link' : 'text-muted'}`}
                  >
                    <Icono aria-hidden className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  {!disponible && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
                      Pronto
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-base font-semibold text-ink">{seccion.titulo}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{seccion.descripcion}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-10 space-y-4 rounded-lg border border-hairline-strong bg-surface p-6">
          <p className="text-base leading-relaxed text-body">
            <strong className="text-ink">Todo es simulado.</strong> Ningún escenario se conecta
            con tu banco, tu correo real ni ningún sistema de verdad. Nada de lo que hagas aquí
            sale de esta plataforma.
          </p>
          <p className="text-base leading-relaxed text-body">
            <strong className="text-ink">Tus datos están seguros.</strong> Tu cédula nunca se
            guarda: solo sirve, por un instante, para comprobar que eres una persona nueva en el
            estudio. Tu nombre y tu correo se usan solo para que puedas entrar, y todo se borra
            cuando el estudio termina.
          </p>
        </div>

        <form onSubmit={handleContinuar} className="mt-8">
          <label className="flex items-start gap-3 text-base text-body">
            <input
              type="checkbox"
              checked={noVolverAMostrar}
              onChange={(event) => setNoVolverAMostrar(event.target.checked)}
              className="mt-1 size-4 shrink-0"
            />
            No volver a mostrar esta pantalla al entrar. Puedes verla de nuevo desde el ícono ⓘ.
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 h-11 rounded-md bg-primary px-6 text-sm font-medium text-on-primary transition hover:bg-primary-active disabled:opacity-60"
          >
            {enviando ? 'Un momento…' : 'Continuar'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default Bienvenida
