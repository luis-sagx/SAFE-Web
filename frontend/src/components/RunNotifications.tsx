import { useCallback, useEffect, useRef } from 'react'
import { Toaster, toast } from 'sonner'
import { flushPendingRuns } from '../lib/pendingRuns'

interface RunNotificationsProps {
  enabled: boolean
}

function RunNotifications({ enabled }: RunNotificationsProps) {
  const requestedSync = useRef(0)
  const syncing = useRef(false)

  const sync = useCallback(async () => {
    if (!enabled) return

    requestedSync.current += 1
    if (syncing.current) return

    syncing.current = true
    try {
      let handledRequest: number

      do {
        handledRequest = requestedSync.current
        const result = await flushPendingRuns()

        if (result.rejected > 0) {
          const message =
            result.rejected === 1
              ? 'Un intento pendiente fue rechazado.'
              : `${result.rejected} intentos pendientes fueron rechazados.`
          toast.error(message, {
            id: 'pending-runs-rejected',
            description: 'No volverán a enviarse automáticamente.',
          })
        } else if (result.sent > 0 && result.remaining === 0) {
          toast.success('Los intentos pendientes se enviaron correctamente.', {
            id: 'pending-runs-sent',
          })
        }
      } while (handledRequest !== requestedSync.current)
    } finally {
      syncing.current = false
    }
  }, [enabled])

  useEffect(() => {
    void sync()
  }, [sync])

  useEffect(() => {
    window.addEventListener('online', sync)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('focus', sync)
    }
  }, [sync])

  return (
    <Toaster
      position="top-right"
      duration={4500}
      visibleToasts={3}
      closeButton
      richColors
      theme="light"
      offset={16}
      mobileOffset={12}
      containerAriaLabel="Notificaciones"
      toastOptions={{
        classNames: {
          toast: 'font-sans shadow-card',
          title: 'text-sm font-semibold',
          description: 'text-sm leading-relaxed',
        },
      }}
    />
  )
}

export default RunNotifications
