import { Info } from 'lucide-react'
import { Link, useLocation } from 'react-router'

// Vive en cada AppHeader por separado (no dentro del propio componente) porque
// cada pantalla ordena sus elementos de forma distinta; inyectarlo desde
// AppHeader rompería esos layouts.
function InfoLink() {
  const location = useLocation()

  return (
    <Link
      to="/bienvenida"
      // Sin esto la bienvenida siempre vuelve al panel, y abrirla a mitad de
      // un escenario le cuesta el escenario entero.
      state={{ from: `${location.pathname}${location.search}` }}
      aria-label="Qué son los tipos de engaño y qué pasa con tus datos"
      title="Información"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-strong hover:text-ink"
    >
      <Info aria-hidden className="size-[18px]" strokeWidth={1.75} />
    </Link>
  )
}

export default InfoLink
