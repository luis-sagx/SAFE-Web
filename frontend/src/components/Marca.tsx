import { useTheme } from '../context/ThemeContext'
import logoMarkDark from '../assets/marca/isotipo-safeweb-oscuro.webp'
import logoMarkLight from '../assets/marca/isotipo-safeweb.webp'
import logoDark from '../assets/marca/logo-safeweb-oscuro.webp'
import logoLight from '../assets/marca/logo-safeweb.webp'

// Tamaños pensados para cómo se muestran, no para el original: el logo va a
// 48 px de alto como mucho (h-12) y el isotipo a 56 px (size-14). 192 y 168 px
// cubren pantallas de hasta 4x y 3x; el original de 2172 px pesaba 8 veces más.
const VARIANTS = {
  logo: {
    claro: logoLight,
    oscuro: logoDark,
    width: 576,
    height: 192,
    alt: 'SafeWeb',
  },
  isotipo: {
    claro: logoMarkLight,
    oscuro: logoMarkDark,
    width: 168,
    height: 168,
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
