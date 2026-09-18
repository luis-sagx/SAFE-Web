import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SoundValue {
  /** Si los efectos de sonido (acertar/fallar/a medias) están activados. */
  activado: boolean
  setActivado: (activado: boolean) => void
}

// Valor por defecto (no undefined, a diferencia de AuthContext): un componente
// sin <SoundProvider> no es un error grave, solo se ve en tests sueltos —
// mismo criterio que ThemeContext.
const DEFAULT: SoundValue = { activado: true, setActivado: () => {} }

const SoundContext = createContext<SoundValue>(DEFAULT)

const KEY = 'sonido'

// localStorage puede lanzar (ventana privada, almacenamiento bloqueado); cae a activado.
function readEnabled(): boolean {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'activado' || saved === 'desactivado') return saved === 'activado'
  } catch {
    // Ignorado: se cae a activado.
  }
  return true
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(readEnabled)

  const setEnabled = useCallback((newEnabled: boolean) => {
    setEnabledState(newEnabled)
    try {
      localStorage.setItem(KEY, newEnabled ? 'activado' : 'desactivado')
    } catch {
      // Sin almacenamiento persistente, la elección solo dura esta pestaña.
    }
  }, [])

  const value = useMemo(() => ({ activado: enabled, setActivado: setEnabled }), [enabled, setEnabled])

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound(): SoundValue {
  return useContext(SoundContext)
}
