import type { ReactNode } from 'react'

// Las dos medias lunas del troquel. Van rellenas del lienzo, no del papel,
// porque son agujeros en el boleto. Se exportan aparte para las líneas de
// perforación que no dibuja este componente (la cabecera del boleto del
// héroe, por ejemplo).
export function Notches({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <>
      <span
        aria-hidden
        className={`absolute -left-px size-5 -translate-x-1/2 rounded-full border border-ticket-edge bg-canvas ${className}`}
      />
      <span
        aria-hidden
        className={`absolute -right-px size-5 translate-x-1/2 rounded-full border border-ticket-edge bg-canvas ${className}`}
      />
    </>
  )
}

// Sello de tinta: lo que se estampa sobre un boleto ya resuelto,aprobado,
// todavía sin grabar, todavía sin abrir,. Va rotado como un sello de verdad y
// el color lo pone quien lo usa; el tono por defecto es el ámbar de lo
// pendiente. Nunca es la única señal: siempre lleva su palabra.
export function Sello({
  tono = 'border-warning text-warning',
  className = '',
  children,
}: Readonly<{ tono?: string; className?: string; children: ReactNode }>) {
  return (
    <span
      className={`inline-block -rotate-[3deg] rounded-sm border-2 px-3 py-1 font-mono text-sm font-semibold uppercase tracking-[0.14em] ${tono} ${className}`}
    >
      {children}
    </span>
  )
}

// Insignia de "aquí vas": relleno verde, no sello. El sello cuenta lo que ya
// pasó; la insignia dice dónde seguir, y solo una la lleva en cada pantalla.
export function Insignia({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-on-primary">
      {children}
    </span>
  )
}

// El átomo del mundo visual de la portada: un boleto de sorteo. Papel
// (bg-ticket) con su sombra sobre el lienzo, el troquel (border-ticket-edge),
// el filete impreso por dentro y, cuando lleva talón, la línea de perforación
// con sus muescas. Todo lo que la portada presenta,el mensaje cebo, el
// recorrido, cada video, es un boleto; no hay tarjetas.
interface TicketProps {
  children: ReactNode
  /** Contenido del talón, debajo de la perforación. */
  talon?: ReactNode
  className?: string
}

function Ticket({ children, talon: stub, className = '' }: Readonly<TicketProps>) {
  return (
    <div
      className={`relative rounded-lg border border-ticket-edge bg-ticket shadow-card ${className}`}
    >
      {/* Filete impreso: el plano intermedio entre el papel y lo que lleva
          encima. Un boleto de verdad trae ese marco, y sin él el papel es un
          rectángulo plano. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[5px] rounded-[7px] border border-ticket-edge opacity-60"
      />

      {children}

      {stub && (
        <div className="relative border-t border-dashed border-ticket-edge">
          <Notches className="-top-2.5" />
          {stub}
        </div>
      )}
    </div>
  )
}

export default Ticket
