import { Trophy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import Ticket from './Boleto'
import CertificateButton from './CertificadoBoton'
import { TRAMA_FONDO } from './TramaFondo'
import { useSound } from '../context/SoundContext'
import { reproducirModuloCompleto } from '../lib/sonidos'

interface FinalTransitionProps {
  totalModulos: number
  onClose: () => void
}

// Se toca una sola vez en la vida del navegador: esta pantalla solo aparece
// la primera vez que se completan los 7 módulos (issue de mejora de la
// insignia final), así que "otra vez" no tiene sentido. Antes vivía en
// Dashboard.tsx, disparado por su propio `complete` — se movió aquí porque
// esta pantalla es el momento real del logro, no el panel que se revisita
// después; misma llave de localStorage para no tocarlo dos veces si alguien
// ya lo había oído con la versión anterior.
const MODULO_COMPLETO_SONADO_KEY = 'modulo-completo-sonado'

// Cierre del entrenamiento completo, no la misma pantalla de "sigue otro
// módulo" (ModuleTransition/TransicionModulo.tsx): ese componente exige un
// `siguiente` módulo y no tiene sentido en el último, donde lo que sigue no
// es otro ataque sino el certificado. Mismo lenguaje visual (Ticket) para que
// se sienta parte de la misma familia, con su propio remate (trofeo, no
// cohete) y las acciones de cierre (certificado/insignia) en la misma
// pantalla en vez de un link genérico al panel.
function FinalTransition({ totalModulos, onClose }: FinalTransitionProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)
  const { activado: soundEnabled } = useSound()

  useEffect(() => {
    linkRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!soundEnabled) return
    try {
      if (localStorage.getItem(MODULO_COMPLETO_SONADO_KEY)) return
      localStorage.setItem(MODULO_COMPLETO_SONADO_KEY, '1')
    } catch {
      // Sin localStorage no hay forma de recordar que ya sonó; se deja sonar
      // esta vez y punto, no vale la pena bloquear el sonido por esto.
    }
    reproducirModuloCompleto()
  }, [soundEnabled])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-transicion-final"
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
            <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">Listo para reclamar</p>
            <p className="mt-1 text-base leading-relaxed text-body">
              Tu certificado y tu insignia para compartir están disponibles ahora mismo.
            </p>
            <CertificateButton />
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <Trophy aria-hidden className="size-11 text-link" strokeWidth={1.5} />
          <p
            id="titulo-transicion-final"
            className="font-display text-2xl uppercase tracking-[0.01em] text-ink sm:text-3xl"
          >
            Completaste todo el entrenamiento
          </p>
          <p className="text-base text-body">
            <span className="font-semibold text-ink tabular-nums">{totalModulos}</span>
            <span className="tabular-nums">/{totalModulos}</span> módulos aprobados
          </p>
        </div>
      </Ticket>

      <Link
        ref={linkRef}
        to="/dashboard"
        className="mt-6 flex min-h-11 w-full max-w-md items-center justify-center rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        Ir al panel →
      </Link>
    </div>
  )
}

export default FinalTransition
