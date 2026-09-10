import { useCallback, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { flushPendingRuns } from '../lib/pendingRuns'

interface RunNotificationsProps {
  enabled: boolean
}

function RunNotifications({ enabled }: RunNotificationsProps) {
  const sync = useCallback(async () => {
    if (!enabled) return

    const result = await flushPendingRuns()
    if (result.sent > 0 && result.remaining === 0) {
      toast.success('Los intentos pendientes se enviaron correctamente.', {
        id: 'pending-runs-sent',
      })
    }
  }, [enabled])

  useEffect(() => {
    void sync()
  }, [sync])

  useEffect(() => {
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
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
