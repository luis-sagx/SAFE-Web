import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import AppHeader from './AppHeader'
import { useAuth } from '../context/AuthContext'
import { getEscenario, getSeccion } from '../data/catalogo'

interface EscenarioLayoutProps {
  /** Misma clave que recibe useScenarioRun, p. ej. 'estafa/saldo-contable'. */
  escenarioId: string
  /** Una línea; queda visible durante todo el escenario. */
  resumen: string
  /** Cuerpo del briefing: la narración que el participante lee antes de entrar. */
  contexto: ReactNode
  /** Va dentro del marco del dispositivo. Solo lo que la app real mostraría. */
  pantalla: ReactNode
  /** Va debajo del marco: pregunta, opciones, feedback, resultado. */
  decision: ReactNode
  onEmpezar: () => void
  /** Forma del marco exterior. 'telefono' es el default: la mayoría de
   *  escenarios (SMS, llamada, chat) se abren en el celular. 'escritorio' es
   *  para correo y web: el phishing se abre más en computador, y así se
   *  distingue de inmediato del resto de amenazas, que sí son de celular. */
  dispositivo?: 'telefono' | 'escritorio'
}

/**
 * Marco común de los escenarios. Sostiene una sola regla: si la app real lo
 * mostraría va en `pantalla`, si no va en `decision`. Un participante no aparece
 * dentro de su propia app bancaria y un banco no tiene una sección "Contexto".
 */
/** Alto y angosto, como se sostiene un celular. */
const MARCO_TELEFONO =
  'sm:max-h-[640px] sm:w-[420px] sm:rounded-[28px] sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[640px] lg:max-h-full lg:flex-none lg:self-center'

/** Ancho y bajo, como una ventana de escritorio. Los anchos con vw + min/max
 *  se recalculan solos según el viewport en vez de un solo punto de quiebre
 *  fijo: sin eso, la ventana se sale de pantalla en un portátil de 1024px, que
 *  es justo donde el layout pasa de apilado a lado a lado. */
const MARCO_ESCRITORIO =
  'sm:max-h-[560px] sm:w-[94vw] sm:max-w-[760px] sm:rounded-xl sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[560px] lg:max-h-full lg:w-[52vw] lg:min-w-[520px] lg:max-w-[820px] lg:flex-none lg:self-center'

function EscenarioLayout({
  escenarioId,
  resumen,
  contexto,
  pantalla,
  decision,
  onEmpezar,
  dispositivo = 'telefono',
}: EscenarioLayoutProps) {
  const escenario = getEscenario(escenarioId)

  if (!escenario) {
    throw new Error(`Escenario "${escenarioId}" no está en el catálogo.`)
  }

  const { displayName, roleLabel } = useAuth()
  const [fase, setFase] = useState<'briefing' | 'escenario'>('briefing')
  const empezarRef = useRef<HTMLButtonElement>(null)
  const escenaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (fase === 'briefing') {
      empezarRef.current?.focus()
    } else {
      escenaRef.current?.focus()
    }
  }, [fase])

  function handleEmpezar() {
    // Reinicia la corrida para que durationMs no incluya el tiempo de lectura
    // del briefing: el hook fija startedAt al montarse, mucho antes de esto.
    onEmpezar()
    setFase('escenario')
  }

  const volver = (
    <Link
      to={`/seccion/${escenario.seccionId}`}
      className="text-sm font-medium text-link underline"
    >
      ← Volver a la sección
    </Link>
  )

  if (fase === 'briefing') {
    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader>{volver}</AppHeader>

        <main className="mx-auto max-w-2xl px-6 py-12">
          <p className="text-sm font-medium text-muted">{getSeccion(escenario.seccionId)?.canal}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {escenario.titulo}
          </h1>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-body">{contexto}</div>

          <button
            ref={empezarRef}
            type="button"
            onClick={handleEmpezar}
            className="mt-10 min-h-11 rounded-md bg-primary px-6 py-3 text-base font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Empezar
          </button>
        </main>
      </div>
    )
  }

  return (
    // h-dvh + overflow-hidden: la página no se desplaza nunca. Lo que se
    // desplaza es el interior del dispositivo, como en una app real, y el
    // bloque de decisión si su contenido no cabe.
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas-soft">
      <AppHeader>
        {volver}
        <p className="text-sm text-muted lg:order-3">
          {displayName} · {roleLabel}
        </p>
        <p className="w-full text-sm leading-snug text-body lg:order-2 lg:w-auto lg:flex-1 lg:px-6">
          {resumen}
        </p>
      </AppHeader>

      {/* Apilado hasta 1024px; lado a lado arriba de eso. En una pantalla de
          900px de alto no entran a la vez un dispositivo creíble y un bloque de
          opciones largo: apilarlos ahí aplasta el dispositivo justo cuando es lo
          que hay que juzgar. */}
      <main className="flex min-h-0 flex-1 flex-col items-center sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8 lg:py-6">
        <div
          ref={escenaRef}
          tabIndex={-1}
          aria-label={`${escenario.titulo}: pantalla simulada`}
          className={`flex min-h-0 w-full flex-1 overflow-hidden focus:outline-none ${
            dispositivo === 'escritorio' ? MARCO_ESCRITORIO : MARCO_TELEFONO
          }`}
        >
          {pantalla}
        </div>

        {/* Apilado, el bloque nunca pasa de media pantalla: si no cabe, se
            desplaza él, no la página. Al costado puede usar todo el alto. */}
        <div className="max-h-[45%] w-full shrink-0 overflow-y-auto border-t border-hairline bg-canvas px-4 py-4 sm:w-[420px] sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:max-h-full lg:self-center">
          {decision}
        </div>
      </main>
    </div>
  )
}

export default EscenarioLayout
