import { useCallback, useRef, useState } from 'react'

/**
 * Replica el flashTransition()/takePhoto() de foto.js y baiting.js: reinicia
 * la animación CSS del flash (ahí lo hacían quitando y volviendo a poner la
 * clase "active" tras forzar un reflow) y ejecuta un callback una vez
 * transcurrido el delay, para revelar el resultado justo cuando el flash
 * está en su punto más brillante.
 */
export function useFlashTransition() {
  const [active, setActive] = useState(false)
  const timeoutRef = useRef(null)

  const trigger = useCallback((callback, delay = 250) => {
    clearTimeout(timeoutRef.current)
    setActive(false)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActive(true)
        timeoutRef.current = setTimeout(() => callback?.(), delay)
      })
    })
  }, [])

  return { active, trigger }
}
