import { useCallback, useRef, useState } from 'react'

// Reinicia la animación CSS del flash y ejecuta el callback pasado el delay,
// para revelar el resultado cuando el flash está en su punto más brillante.
export function useFlashTransition() {
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const trigger = useCallback((callback?: () => void, delay = 250) => {
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
