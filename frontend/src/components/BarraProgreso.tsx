/**
 * Barra de avance de un módulo o del entrenamiento completo.
 *
 * Dos formas, misma semántica:
 *
 * - `segmentada` (por defecto hasta 12 escenarios): una celda por escenario.
 *   Con 8 casos se puede *contar* el avance de un vistazo, que es justo lo que
 *   pide una pantalla de módulo — "me faltan tres" es más accionable que "38%".
 * - `continua`: para el total del entrenamiento, donde las celdas serían
 *   demasiadas y demasiado finas para leerse.
 *
 * La marca de meta es lo que vuelve honesta a la barra: el gating no exige
 * completar todo, exige `requeridos` de `total` (6 de 8 en phishing). Sin ella
 * la barra llena significaría algo distinto de "aprobado" y confundiría.
 */

interface BarraProgresoProps {
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

function BarraProgreso({
  aprobados,
  total,
  requeridos,
  aprobado = false,
  variante,
  etiqueta,
  className = '',
}: BarraProgresoProps) {
  // Un total de 0 solo pasa en una sección sin escenarios, donde esta barra no
  // se pinta; aun así se evita la división por cero antes que confiar en eso.
  const seguro = Math.max(total, 1)
  const hechos = Math.min(Math.max(aprobados, 0), total)
  const forma = variante ?? (total <= 12 ? 'segmentada' : 'continua')

  // Verde de acierto solo al aprobar; mientras tanto, el verde de marca. En una
  // app donde verde significa "acertaste", teñir de éxito un avance a medias
  // sería decir algo que todavía no es cierto (DESIGN.md §1).
  const relleno = aprobado ? 'bg-success' : 'bg-primary'

  const textoAccesible = requeridos
    ? `${hechos} de ${total} escenarios aprobados; se necesitan ${requeridos}`
    : `${hechos} de ${total} escenarios aprobados`

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={hechos}
      aria-valuetext={textoAccesible}
      aria-label={etiqueta}
      className={`relative ${className}`}
    >
      {forma === 'segmentada' ? (
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => {
            // La celda que marca la meta lleva un borde inferior más oscuro:
            // señala "de aquí en adelante ya aprobaste" sin añadir otro color.
            const esMeta = requeridos !== undefined && i + 1 === requeridos
            return (
              <span
                key={i}
                className={`h-2 flex-1 rounded-xs transition-colors duration-500 motion-reduce:transition-none ${
                  i < hechos ? relleno : 'bg-surface-strong'
                } ${esMeta ? 'ring-1 ring-inset ring-ink/25' : ''}`}
              />
            )
          })}
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-xs bg-surface-strong">
          <div
            className={`h-full rounded-xs transition-[width] duration-500 motion-reduce:transition-none ${relleno}`}
            style={{ width: `${(hechos / seguro) * 100}%` }}
          />
        </div>
      )}

      {/* Marca de meta en la barra continua: una línea vertical fina. En la
          segmentada el propio anillo de la celda ya la indica. */}
      {forma === 'continua' && requeridos !== undefined && requeridos < total && (
        <span
          aria-hidden
          className="absolute top-0 h-2 w-px bg-ink/40"
          style={{ left: `${(requeridos / seguro) * 100}%` }}
        />
      )}
    </div>
  )
}

export default BarraProgreso
