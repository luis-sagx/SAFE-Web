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

// El átomo del mundo visual de la portada: un boleto de sorteo. Papel
// (bg-ticket) con su sombra sobre el lienzo, el troquel (border-ticket-edge),
// el filete impreso por dentro y, cuando lleva talón, la línea de perforación
// con sus muescas. Todo lo que la portada presenta —el mensaje cebo, el
// recorrido, cada video— es un boleto; no hay tarjetas.
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
