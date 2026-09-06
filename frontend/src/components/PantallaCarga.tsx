/**
 * Lo que se ve mientras la app decide qué pantalla toca: comprobar la sesión,
 * bajar el trozo de código de un escenario, pedir el progreso de un módulo.
 *
 * Antes era un "Cargando…" suelto en la esquina superior izquierda de una
 * página en blanco, que durante ese segundo no se distinguía de un error. Con
 * el isotipo centrado y el anillo girando, la espera se lee como espera.
 *
 * El texto sigue ahí y sigue diciendo "Cargando…": es lo que anuncia el
 * `role="status"` a un lector de pantalla, para el que una animación no existe.
 */
function PantallaCarga({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6"
    >
      <div className="relative flex size-24 items-center justify-center">
        {/* Un solo borde coloreado sobre un anillo tenue: al girar deja el arco
            verde recorriendo la circunferencia. `motion-reduce` lo detiene y
            queda un anillo quieto alrededor de la marca. */}
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-hairline-strong border-t-primary [animation-duration:1.1s] motion-reduce:animate-none"
        />
        <img
          src="/marca/isotipo-safeweb.webp"
          alt=""
          width={1253}
          height={1253}
          className="size-14"
        />
      </div>

      <p className="text-base text-muted">{mensaje}</p>
    </div>
  )
}

export default PantallaCarga
