import { Info } from 'lucide-react'
import { Link } from 'react-router'

/**
 * Ícono ⓘ que abre la bienvenida en cualquier momento, la haya visto ya el
 * participante o no. Vive en cada `AppHeader` por separado —no dentro del
 * propio componente— porque cada pantalla ordena sus elementos del header de
 * forma distinta (ver EscenarioLayout, con columnas que cambian de orden en
 * escritorio); intentar que AppHeader lo inyecte solo rompería esos layouts.
 */
function InfoLink() {
  return (
    <Link
      to="/bienvenida"
      aria-label="Qué son los tipos de engaño y qué pasa con tus datos"
      title="Información"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-strong hover:text-ink"
    >
      <Info aria-hidden className="size-[18px]" strokeWidth={1.75} />
    </Link>
  )
}

export default InfoLink
