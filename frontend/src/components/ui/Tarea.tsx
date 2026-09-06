import type { ReactNode } from 'react'

/**
 * Una línea del checklist de un escenario que se juega sobre la pantalla: qué
 * falta por hacer y qué ya está hecho.
 *
 * Vive aquí y no en cada escenario porque es la respuesta a "¿cómo sé si voy
 * bien?" en todos los que no tienen lista de opciones, y dos copias del mismo
 * marcador acaban divergiendo en tamaño, color y tono —igual que pasó con el
 * aviso de "ahí no hay nada" antes de que existiera Instrucciones.
 */
function Tarea({ hecho, children }: { hecho: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          hecho ? 'bg-success text-white' : 'border border-hairline-strong text-transparent'
        }`}
      >
        ✓
      </span>
      <span className={`text-lg leading-relaxed ${hecho ? 'text-muted' : 'text-body'}`}>
        {children}
      </span>
    </li>
  )
}

export default Tarea
