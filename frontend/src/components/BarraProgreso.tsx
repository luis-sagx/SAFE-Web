// `segmentada` (hasta 12, por defecto) permite *contar* el avance de un vistazo; `continua`
// es para el total del entrenamiento, donde las celdas serían demasiado finas. La marca de
// meta es necesaria porque el gating exige `requeridos` de `total`, no completar todo.

interface ProgressBarProps {
  aprobados: number
  total: number
  /** Umbral que exige el servidor. Se dibuja como marca de meta sobre la barra. */
  requeridos?: number
  aprobado?: boolean
  variante?: 'segmentada' | 'continua'
  /** Texto accesible cuando la barra no va acompañada de un rótulo visible. */
  etiqueta?: string
  className?: string
}

function ProgressBar({
  aprobados: approvedCount,
  total,
  requeridos: required,
  aprobado: isApproved = false,
  variante: variant,
  etiqueta: label,
  className = '',
}: ProgressBarProps) {
  // Un total de 0 solo pasa en una sección sin escenarios, donde esta barra no
  // se pinta; aun así se evita la división por cero antes que confiar en eso.
  const safe = Math.max(total, 1)
  const done = Math.min(Math.max(approvedCount, 0), total)
  const form = variant ?? (total <= 12 ? 'segmentada' : 'continua')

  // Verde de acierto solo al aprobar; mientras tanto, el verde de marca. En una
  // app donde verde significa "acertaste", teñir de éxito un avance a medias
  // sería decir algo que todavía no es cierto (DESIGN.md §1).
  const padding = isApproved ? 'bg-success' : 'bg-primary'

  const textAccessible = required
    ? `${done} de ${total} escenarios aprobados; se necesitan ${required}`
    : `${done} de ${total} escenarios aprobados`

  return (
    <div className={`relative ${className}`}>
      <progress
        className="sr-only"
        max={total}
        value={done}
        aria-label={label}
        aria-valuetext={textAccessible}
      />
      {form === 'segmentada' ? (
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => {
            // La celda que marca la meta lleva un borde inferior más oscuro:
            // señala "de aquí en adelante ya aprobaste" sin añadir otro color.
            const isTarget = required !== undefined && i + 1 === required
            return (
              <span
                key={i}
                className={`h-2 flex-1 rounded-xs transition-colors duration-500 motion-reduce:transition-none ${
                  i < done ? padding : 'bg-surface-strong'
                } ${isTarget ? 'ring-1 ring-inset ring-ink/25' : ''}`}
              />
            )
          })}
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-xs bg-surface-strong">
          <div
            className={`h-full rounded-xs transition-[width] duration-500 motion-reduce:transition-none ${padding}`}
            style={{ width: `${(done / safe) * 100}%` }}
          />
        </div>
      )}

      {/* Marca de meta en la barra continua: una línea vertical fina. En la
          segmentada el propio anillo de la celda ya la indica. */}
      {form === 'continua' && required !== undefined && required < total && (
        <span
          aria-hidden
          className="absolute top-0 h-2 w-px bg-ink/40"
          style={{ left: `${(required / safe) * 100}%` }}
        />
      )}
    </div>
  )
}

export default ProgressBar
