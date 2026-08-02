import type { ReactNode } from 'react'

/**
 * Barra de navegación única de la app. Existe para que el enlace de retorno
 * tenga siempre la misma altura y el mismo margen izquierdo en todas las
 * pantallas: el ancho del contenido de cada página cambia, el de la barra no.
 */
function AppHeader({ children }: { children: ReactNode }) {
  return (
    <header className="shrink-0 border-b border-hairline bg-canvas">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2">
        {children}
      </div>
    </header>
  )
}

export default AppHeader
