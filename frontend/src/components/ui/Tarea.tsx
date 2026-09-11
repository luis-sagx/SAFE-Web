import type { ReactNode } from 'react'

// Compartido (no copiado por escenario) para que el marcador no diverja en
// tamaño, color y tono entre escenarios.
function Tarea({ hecho, children }: { hecho: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          hecho ? 'bg-success text-on-success' : 'border border-hairline-strong text-transparent'
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
