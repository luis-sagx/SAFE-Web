import { useTheme } from '../context/ThemeContext'

const VARIANTS = {
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

interface BrandProps {
  variante: 'logo' | 'isotipo'
  className?: string
}

// El logo lleva "Safe" en tinta casi negra, invisible en oscuro; la variante
// -oscuro.webp recolorea solo esos píxeles neutros (no filter: invert(),
// que también invertiría el verde de marca).
function Brand({ variante: variant, className }: BrandProps) {
  const { temaEfectivo: themeEffective } = useTheme()
  const { width, height, alt, ...paths } = VARIANTS[variant]

  return (
    <img
      src={paths[themeEffective]}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}

export default Brand
