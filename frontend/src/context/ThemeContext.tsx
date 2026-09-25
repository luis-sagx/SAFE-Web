import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Preference = 'claro' | 'oscuro'

interface ThemeValue {
  /** Lo que la persona escogió. */
  preferencia: Preference
  /** Lo que se está mostrando. Sin la opción "sistema" coincide siempre con
   *  la preferencia; se mantiene para no tocar a quienes ya lo leen. */
  temaEfectivo: Preference
  setPreferencia: (preference: Preference) => void
}

// Valor por defecto (no undefined, a diferencia de AuthContext): un componente
// sin <ThemeProvider> no es un error grave, solo se ve en tests sueltos.
const DEFAULT: ThemeValue = { preferencia: 'claro', temaEfectivo: 'claro', setPreferencia: () => {} }

const ThemeContext = createContext<ThemeValue>(DEFAULT)

const STORAGE_KEY = 'tema'

// Arranca siempre en claro salvo que la persona haya elegido oscuro. Un
// "sistema" guardado por la versión anterior cuenta como "no eligió".
// localStorage puede lanzar (ventana privada, almacenamiento bloqueado).
// Misma regla que public/tema.js, que pinta antes de que React monte.
function readPreference(): Preference {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'oscuro') return 'oscuro'
  } catch {
    // Ignorado: se queda en claro.
  }
  return 'claro'
}

// Montado fuera de AuthProvider: el tema no depende de la sesión y debe existir en
// rutas públicas. data-tema ya lo puso public/tema.js antes del pintado; esto solo sincroniza.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<Preference>(readPreference)

  const setPreference = useCallback((newPreference: Preference) => {
    setPreferenceState(newPreference)
    try {
      localStorage.setItem(STORAGE_KEY, newPreference)
    } catch {
      // Sin almacenamiento persistente, la elección solo dura esta pestaña.
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.tema = preference
  }, [preference])

  const value = useMemo(
    () => ({
      preferencia: preference,
      temaEfectivo: preference,
      setPreferencia: setPreference,
    }),
    [preference, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext)
}
