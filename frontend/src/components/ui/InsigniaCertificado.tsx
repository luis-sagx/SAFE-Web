import { ShieldCheck } from 'lucide-react'
import type { Ref } from 'react'

interface CertificateBadgeProps {
  nombre: string | null
  modulos: string[]
  horas: number
  className?: string
  /** React 19: los componentes de función reciben `ref` como prop normal, sin
   *  `forwardRef`. Se usa para rasterizar este mismo SVG a PNG (ver
   *  insigniaImagen.ts) sin tener que reconstruirlo aparte. */
  ref?: Ref<SVGSVGElement>
}

// Misma paleta que el PDF del certificado (pdf.ts en identidad), no la del
// sistema de diseño en pantalla: es un documento ornamentado para compartir,
// no una pieza de interfaz — DESIGN.md (un solo verde, sin degradados) es
// para eso otro.
const DARK_GREEN = '#00401f'
const BRAND_GREEN = '#006837'
const GOLD = '#b6903f'
const LIGHT_GOLD = '#d9bd7a'
const CREAM = '#faf7ef'
const INK = '#1a1a1a'

// Medallón circular tipo Cisco/Credly, no una tarjeta ni el PDF formal: se
// descarga como imagen para compartir en LinkedIn u otra red (issue #230).
// El aro dorado + la cinta abajo son lo que la distingue de un simple ícono.
function CertificateBadge({ nombre, modulos, horas, className = '', ref }: Readonly<CertificateBadgeProps>) {
  const displayName = nombre?.trim() || 'Participante SAFE-Web'
  const moduleCount = modulos.length
  const moduleLabel = moduleCount === 1 ? '1 módulo' : `${moduleCount} módulos`

  return (
    <svg
      ref={ref}
      data-insignia
      viewBox="0 0 320 360"
      role="img"
      aria-label={`Insignia SAFE-Web de ${displayName}`}
      className={className}
    >
      <defs>
        <linearGradient id="insignia-aro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={LIGHT_GOLD} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>

      {/* Aro dorado. */}
      <circle cx="160" cy="150" r="145" fill="url(#insignia-aro)" />
      {/* Disco interior. */}
      <circle cx="160" cy="150" r="128" fill={CREAM} stroke={DARK_GREEN} strokeWidth="3" />

      <g transform="translate(120, 60)">
        <ShieldCheck absoluteStrokeWidth width={80} height={80} color={BRAND_GREEN} strokeWidth={1.75} />
      </g>

      <text x="160" y="185" textAnchor="middle" fontSize="20" fontWeight="700" fill={DARK_GREEN} letterSpacing="1">
        SAFE-WEB
      </text>
      <text x="160" y="210" textAnchor="middle" fontSize="13" fill={INK} letterSpacing="2">
        CERTIFICADO
      </text>
      <text x="160" y="235" textAnchor="middle" fontSize="12" fill={INK}>
        {moduleLabel} · {horas} horas
      </text>

      {/* Cinta: dos trapecios que salen por debajo del disco, como una condecoración real. */}
      <polygon points="118,270 142,270 132,340 100,325" fill={BRAND_GREEN} />
      <polygon points="202,270 178,270 188,340 220,325" fill={BRAND_GREEN} />

      <rect x="40" y="270" width="240" height="44" rx="6" fill={DARK_GREEN} />
      <text x="160" y="298" textAnchor="middle" fontSize="16" fontWeight="600" fill={CREAM}>
        {displayName}
      </text>
    </svg>
  )
}

export default CertificateBadge
