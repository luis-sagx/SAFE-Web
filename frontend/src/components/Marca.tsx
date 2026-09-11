import { useTheme } from '../context/ThemeContext'

const VARIANTES = {
  logo: {
    claro: '/marca/logo-safeweb.webp',
    oscuro: '/marca/logo-safeweb-oscuro.webp',
    width: 2171,
    height: 723,
    alt: 'SafeWeb',
  },
  isotipo: {
    claro: '/marca/isotipo-safeweb.webp',
    oscuro: '/marca/isotipo-safeweb-oscuro.webp',
    width: 1253,
    height: 1253,
    alt: '',
  },
} as const

interface MarcaProps {
  variante: 'logo' | 'isotipo'
  className?: string
}

// El logo lleva "Safe" en tinta casi negra, invisible en oscuro; la variante
// -oscuro.webp recolorea solo esos píxeles neutros (no filter: invert(),
// que también invertiría el verde de marca).
function Marca({ variante, className }: MarcaProps) {
  const { temaEfectivo } = useTheme()
  const { width, height, alt, ...rutas } = VARIANTES[variante]

  return (
    <img
      src={rutas[temaEfectivo]}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}

export default Marca
