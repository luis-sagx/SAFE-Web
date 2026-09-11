import Marca from './Marca'

// El texto "Cargando…" se mantiene porque es lo que role="status" anuncia a
// un lector de pantalla, para el que la animación no existe.
function PantallaCarga({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6"
    >
      <div className="relative flex size-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-hairline-strong border-t-primary [animation-duration:1.1s] motion-reduce:animate-none"
        />
        <Marca variante="isotipo" className="size-14" />
      </div>

      <p className="text-base text-muted">{mensaje}</p>
    </div>
  )
}

export default PantallaCarga
