import type { ReactNode } from 'react'

interface AuthLayoutProps {
  titulo: string
  subtitulo: string
  children: ReactNode
  pie: ReactNode
}

/// Dos columnas en escritorio: el lado de marca explica de qué va la
/// plataforma; el formulario queda en una tarjeta a la derecha.
function AuthLayout({ titulo, subtitulo, children, pie }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-mint-light to-canvas">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-ink">
            SAFE Web
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Aprende a reconocer un engaño antes de caer en uno.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-body">
            Situaciones de fraude recreadas en un entorno seguro: nada de lo que hagas aquí toca tu
            banco ni tus datos reales. Aprende con la práctica, no con el miedo.
          </p>

          <ul className="mt-6 space-y-2">
            {[
              'Mensajes, llamadas y compras como las de todos los días.',
              'Decides como en la vida real y al final vemos qué señales había.',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-base text-body">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <section className="w-full rounded-xl border border-hairline-strong bg-surface p-8 shadow-card lg:w-[400px] lg:shrink-0">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{titulo}</h2>
          <p className="mt-2 text-base text-body">{subtitulo}</p>
          {children}
          {pie}
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
