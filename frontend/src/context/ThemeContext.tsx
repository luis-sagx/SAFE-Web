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

// Valor por defecto (no undefined): a diferencia de AuthContext, un
// componente que use useTheme() sin <ThemeProvider> no representa un error de
// programación grave, así que no hace falta que lance. En producción
// ThemeProvider siempre envuelve la app desde main.tsx; este valor solo se ve
// en los tests de componentes sueltos (Login, MenuUsuario, escenarios…) que,
// como AuthContext, se mockean por archivo en vez de montar cada provider
// real — aquí no hace falta ni eso: se renderizan en claro/sistema y punto.
const PREDETERMINADO: ThemeValue = { preferencia: 'sistema', temaEfectivo: 'claro', setPreferencia: () => {} }

const ThemeContext = createContext<ThemeValue>(PREDETERMINADO)

const CLAVE = 'tema'
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)'

/** Envuelve toda lectura/escritura: en una ventana privada o con el
 *  almacenamiento bloqueado, localStorage lanza, y el tema debe caer a
 *  "sistema" en vez de romper el arranque de la aplicación. */
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

/**
 * Provider del tema claro/oscuro, montado en main.tsx por fuera de
 * AuthProvider: el tema no depende de la sesión y tiene que existir también
 * en las rutas públicas (Login, Registro, Verificar, PoliticaDatos).
 *
 * El atributo data-tema ya lo puso el script inline de index.html antes del
 * primer pintado (evita el destello blanco); este provider solo toma el
 * control después del montaje y lo mantiene sincronizado.
 *
 * Ver docs/superpowers/specs/2026-09-10-tema-oscuro-design.md §4.
 */
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

    // Con la preferencia en "sistema", seguir el cambio en vivo si la persona
    // alterna el tema del sistema operativo con la pestaña abierta.
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
