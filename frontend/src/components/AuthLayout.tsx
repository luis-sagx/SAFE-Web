import type { ReactNode } from 'react'
import Brand from './Marca'
import ThemeSelector from './SelectorTema'
import Ticket from './Boleto'

interface AuthLayoutProps {
  /// Rótulo del boleto (p. ej. "ACCESO", "REGISTRO"): mismo lenguaje que el
  /// folio de la portada y de cada escenario, para que esta pantalla no
  /// deje de sentirse parte de SAFE-Web.
  folio: string
  titulo: string
  subtitulo: string
  children: ReactNode
  pie: ReactNode
}

/// Un solo boleto, no dos piezas sueltas: el texto de marca y el formulario
/// son las dos mitades del MISMO papel, separadas por una perforación —
/// nunca "un título flotando al lado de una tarjeta". En escritorio la
/// perforación es vertical (dos columnas); en celular, horizontal (apilado).
function AuthLayout({ folio, titulo: title, subtitulo: subtitle, children, pie }: AuthLayoutProps) {
  return (
    // Flujo normal y no `absolute`: flotando arriba del todo, el selector se
    // salía de la vista al hacer scroll (o se montaba encima del logo en una
    // pantalla baja) — acá siempre tiene su propio espacio reservado.
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-4xl justify-end px-6 pt-6">
        <ThemeSelector />
      </div>
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
        <Ticket className="w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Centrado vertical en escritorio: la columna del formulario
                suele ser más alta (tiene más campos), y sin esto el logo y
                el título quedaban pegados arriba con todo el resto del aire
                vacío debajo, como perdidos en la esquina. */}
            <div className="p-8 lg:flex-1 lg:self-center lg:p-12">
              <Brand variante="logo" className="h-12 w-auto" />
              <h1 className="mt-4 font-display text-3xl uppercase leading-[0.95] tracking-[0.01em] text-ink sm:text-4xl">
                Aprende a reconocer un engaño antes de caer en uno.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-body">
                Situaciones de fraude recreadas en un entorno seguro, sin tocar tu banco ni tus
                datos reales.
              </p>
            </div>

            {/* La perforación: punteada y horizontal apilado (arriba del
                formulario), vertical en escritorio (a la izquierda) — el
                mismo filete que separa cabecera y contenido en el resto del
                sistema, solo que rotado según cómo se acomodan las columnas. */}
            <div className="border-t border-dashed border-ticket-edge p-8 lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0 lg:p-10">
              <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">{folio}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
              <p className="mt-2 text-base text-body">{subtitle}</p>
              {children}
              {pie}
            </div>
          </div>
        </Ticket>
      </div>
    </div>
  )
}

export default AuthLayout
