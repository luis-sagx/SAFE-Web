import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Preference = 'sistema' | 'claro' | 'oscuro'
type EffectiveTheme = 'claro' | 'oscuro'

interface ThemeValue {
  /** Lo que la persona escogió. */
  preferencia: Preference
  /** Lo que se está mostrando ahora mismo, ya resuelto contra el sistema. */
  temaEfectivo: EffectiveTheme
  setPreferencia: (preference: Preference) => void
}

// Valor por defecto (no undefined, a diferencia de AuthContext): un componente
// sin <ThemeProvider> no es un error grave, solo se ve en tests sueltos.
const DEFAULT: ThemeValue = { preferencia: 'sistema', temaEfectivo: 'claro', setPreferencia: () => {} }

const ThemeContext = createContext<ThemeValue>(DEFAULT)

const PASSWORD = 'tema'
const QUERY_DARK = '(prefers-color-scheme: dark)'

// localStorage puede lanzar (ventana privada, almacenamiento bloqueado); cae a "sistema".
function readPreference(): Preference {
  try {
    const saved = localStorage.getItem(PASSWORD)
    if (saved === 'claro' || saved === 'oscuro' || saved === 'sistema') return saved
  } catch {
    // Ignorado: se cae a "sistema".
  }
  return 'sistema'
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia(QUERY_DARK).matches
}

function resolve(preference: Preference): EffectiveTheme {
  if (preference === 'claro') return 'claro'
  if (preference === 'oscuro') return 'oscuro'
  return systemPrefersDark() ? 'oscuro' : 'claro'
}

// Montado fuera de AuthProvider: el tema no depende de la sesión y debe existir en
// rutas públicas. data-tema ya lo puso public/tema.js antes del pintado; esto solo sincroniza.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<Preference>(readPreference)
  const [themeEffective, setEffectiveTheme] = useState<EffectiveTheme>(() => resolve(preference))

  const setPreference = useCallback((newPreference: Preference) => {
    setPreferenceState(newPreference)
    try {
      localStorage.setItem(PASSWORD, newPreference)
    } catch {
      // Sin almacenamiento persistente, la elección solo dura esta pestaña.
    }
  }, [])

  useEffect(() => {
    const effective = resolve(preference)
    setEffectiveTheme(effective)
    document.documentElement.dataset.tema = effective === 'oscuro' ? 'oscuro' : 'claro'

    // En "sistema", seguir el cambio en vivo si se alterna el tema del SO.
    if (preference !== 'sistema' || typeof matchMedia !== 'function') return
    const media = matchMedia(QUERY_DARK)
    const sync = () => {
      const newTheme = media.matches ? 'oscuro' : 'claro'
      setEffectiveTheme(newTheme)
      document.documentElement.dataset.tema = newTheme
    }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preference])

  const value = useMemo(
    () => ({
      preferencia: preference,
      temaEfectivo: themeEffective,
      setPreferencia: setPreference,
    }),
    [preference, themeEffective, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext)
}
