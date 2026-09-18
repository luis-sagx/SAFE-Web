import { Rocket } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import Ticket from './Boleto'
import { TRAMA_FONDO } from './TramaFondo'
import type { Section } from '../data/catalogo'

interface ModuleTransitionProps {
  /** Módulo que se acaba de aprobar. */
  seccion: Section
  aprobados: number
  total: number
  /** Módulo al que se puede pasar ahora. */
  siguiente: Section
  onClose: () => void
}

// Pantalla de celebración, no un banner dentro del veredicto (issue #229): antes el aviso de
// "aprobaste el módulo, sigue otro" vivía metido en el mismo panel de veredicto del último
// escenario y pasaba desapercibido. Como pantalla aparte, con su propio "cambio de escena", se
// nota que el módulo actual quedó atrás y que el siguiente es un tipo de ataque distinto.
//
// El boleto (Ticket), no una tarjeta genérica ni un emoji: es el mismo lenguaje visual del
// dashboard y de la sección (papel + troquel + perforación), para que esta pantalla se sienta
// parte de la app y no un aviso importado de otro sitio.
function ModuleTransition({ seccion: section, aprobados, total, siguiente: next, onClose }: ModuleTransitionProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const NextIcon = next.Icono

  useEffect(() => {
    linkRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-transicion"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-canvas px-6 py-10 ${TRAMA_FONDO}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-base font-medium text-link underline"
      >
        Seguir aquí
      </button>

      <Ticket
        className="w-full max-w-md"
        talon={
          <div className="flex flex-col items-center gap-1 px-6 py-6 text-center">
            <NextIcon aria-hidden className="size-6 text-link" strokeWidth={1.75} />
            <p className="mt-1 font-mono text-sm uppercase tracking-[0.14em] text-muted">Sigue</p>
            <p className="font-display text-xl uppercase tracking-[0.01em] text-ink">{next.titulo}</p>
            <p className="mt-1 text-base leading-relaxed text-body">{next.descripcion}</p>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <Rocket aria-hidden className="size-11 text-link" strokeWidth={1.5} />
          <p id="titulo-transicion" className="font-display text-2xl uppercase tracking-[0.01em] text-ink sm:text-3xl">
            Aprobaste {section.titulo}
          </p>
          <p className="text-base text-body">
            <span className="font-semibold text-ink tabular-nums">{aprobados}</span>
            <span className="tabular-nums">/{total}</span> escenarios aprobados
          </p>
        </div>
      </Ticket>

      <Link
        ref={linkRef}
        to={`/seccion/${next.id}`}
        className="mt-6 flex min-h-11 w-full max-w-md items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        Ir a {next.titulo} →
      </Link>
    </div>
  )
}

export default ModuleTransition
