import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Preferencia = 'sistema' | 'claro' | 'oscuro'
type TemaEfectivo = 'claro' | 'oscuro'

interface ThemeValue {
  /** Lo que la persona escogió. */
  preferencia: Preferencia
  /** Lo que se está mostrando ahora mismo, ya resuelto contra el sistema. */
  temaEfectivo: TemaEfectivo
  setPreferencia: (preferencia: Preferencia) => void
}

// Valor por defecto (no undefined, a diferencia de AuthContext): un componente
// sin <ThemeProvider> no es un error grave, solo se ve en tests sueltos.
const PREDETERMINADO: ThemeValue = { preferencia: 'sistema', temaEfectivo: 'claro', setPreferencia: () => {} }

const ThemeContext = createContext<ThemeValue>(PREDETERMINADO)

const CLAVE = 'tema'
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)'

// localStorage puede lanzar (ventana privada, almacenamiento bloqueado); cae a "sistema".
function leerPreferencia(): Preferencia {
  try {
    const guardada = localStorage.getItem(CLAVE)
    if (guardada === 'claro' || guardada === 'oscuro' || guardada === 'sistema') return guardada
  } catch {
    // Ignorado: se cae a "sistema".
  }
  return 'sistema'
}

function sistemaPrefiereOscuro(): boolean {
  return typeof matchMedia === 'function' && matchMedia(CONSULTA_OSCURO).matches
}

function resolver(preferencia: Preferencia): TemaEfectivo {
  if (preferencia === 'claro') return 'claro'
  if (preferencia === 'oscuro') return 'oscuro'
  return sistemaPrefiereOscuro() ? 'oscuro' : 'claro'
}

// Montado fuera de AuthProvider: el tema no depende de la sesión y debe existir en
// rutas públicas. data-tema ya lo puso index.html antes del pintado; esto solo sincroniza.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferenciaState] = useState<Preferencia>(leerPreferencia)
  const [temaEfectivo, setTemaEfectivo] = useState<TemaEfectivo>(() => resolver(preferencia))

  const setPreferencia = useCallback((nueva: Preferencia) => {
    setPreferenciaState(nueva)
    try {
      localStorage.setItem(CLAVE, nueva)
    } catch {
      // Sin almacenamiento persistente, la elección solo dura esta pestaña.
    }
  }, [])

  useEffect(() => {
    const efectivo = resolver(preferencia)
    setTemaEfectivo(efectivo)
    document.documentElement.dataset.tema = efectivo === 'oscuro' ? 'oscuro' : 'claro'

    // En "sistema", seguir el cambio en vivo si se alterna el tema del SO.
    if (preferencia !== 'sistema' || typeof matchMedia !== 'function') return
    const medios = matchMedia(CONSULTA_OSCURO)
    const sync = () => {
      const nuevo = medios.matches ? 'oscuro' : 'claro'
      setTemaEfectivo(nuevo)
      document.documentElement.dataset.tema = nuevo
    }
    medios.addEventListener('change', sync)
    return () => medios.removeEventListener('change', sync)
  }, [preferencia])

  const value = useMemo(
    () => ({ preferencia, temaEfectivo, setPreferencia }),
    [preferencia, temaEfectivo, setPreferencia],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext)
}
