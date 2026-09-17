import type { ReactNode } from "react";
import { SCENARIOS, SECTIONS } from "../data/catalogo";
import Brand from "./Marca";
import ThemeMenu from "./MenuTema";
import Ticket from "./Boleto";
import { TRAMA_FONDO } from "./TramaFondo";

interface AuthLayoutProps {
  /// Rótulo del boleto (p. ej. "ACCESO", "REGISTRO"): mismo lenguaje que el
  /// folio de la portada y de cada escenario, para que esta pantalla no
  /// deje de sentirse parte de SAFE-Web.
  folio: string;
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  pie: ReactNode;
}

/// Un solo boleto, no dos piezas sueltas: el texto de marca y el formulario
/// son las dos mitades del MISMO papel, separadas por una perforación,
/// nunca "un título flotando al lado de una tarjeta". En escritorio la
/// perforación es vertical (dos columnas); en celular, horizontal (apilado).
function AuthLayout({
  folio,
  titulo: title,
  subtitulo: subtitle,
  children,
  pie,
}: Readonly<AuthLayoutProps>) {
  return (
    // Sin selector aparte arriba de la página: ahora vive dentro del propio
    // boleto (ver más abajo), así que este contenedor ya no le reserva
    // espacio a nada.
    <div className={`relative min-h-screen overflow-hidden bg-canvas ${TRAMA_FONDO}`}>
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
        <Ticket className="w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* flex-col + justify-between: el bloque de marca se centra en
                el espacio que sobra (mismo motivo que antes, la columna del
                formulario suele ser más alta), pero el selector de tema
                siempre se queda pegado abajo del todo, no viaja con el resto. */}
            <div className="flex min-w-0 flex-col p-8 lg:flex-1 lg:p-12">
              <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
                {/* self-start: dentro de un flex-col la imagen se estira a todo el
                    ancho (align-items: stretch) aunque tenga w-auto. */}
                <Brand variante="logo" className="h-12 w-auto self-start" />
                <h1 className="mt-4 font-display text-3xl uppercase leading-[1.2] tracking-[0.01em] text-ink sm:text-4xl">
                  Aprende a reconocer un engaño antes de caer en uno.
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-body">
                  Situaciones de fraude recreadas en un entorno seguro, sin
                  tocar tu banco ni tus datos reales.
                </p>

                {/* Mismo contador de la portada, con los mismos datos reales
                    del catálogo: no es relleno, es lo que ya cuenta afuera,
                    aquí también respalda que hay contenido de verdad detrás. */}
                <p className="mt-8 flex flex-wrap gap-y-2 font-mono text-sm uppercase tracking-[0.12em] text-muted">
                  {[
                    `${SECTIONS.length} módulos`,
                    `${SCENARIOS.length} escenarios`,
                  ].map((count) => (
                    <span
                      key={count}
                      className="mr-4 border-l border-ticket-edge pl-4 first:border-l-0 first:pl-0"
                    >
                      {count}
                    </span>
                  ))}
                </p>
              </div>

              {/* -ml-3: el ícono del botón se alinea con el borde del texto. */}
              <div className="-ml-3 mt-8 lg:mt-10">
                <ThemeMenu abre="arriba" />
              </div>
            </div>

            {/* La perforación: punteada y horizontal apilado (arriba del
                formulario), vertical en escritorio (a la izquierda), el
                mismo filete que separa cabecera y contenido en el resto del
                sistema, solo que rotado según cómo se acomodan las columnas. */}
            <div className="border-t border-dashed border-ticket-edge p-8 min-w-0 lg:flex-1 lg:border-l lg:border-t-0 lg:p-12">
              <p className="font-mono text-sm uppercase tracking-[0.14em] text-muted">
                {folio}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <p className="mt-2 text-base text-body">{subtitle}</p>
              {children}
              {pie}
            </div>
          </div>
        </Ticket>
      </div>
    </div>
  );
}

export default AuthLayout;
