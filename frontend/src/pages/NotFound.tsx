import { useEffect } from 'react'
import { Link } from 'react-router'
import Ticket, { Sello } from '../components/Boleto'
import Brand from '../components/Marca'
import { TRAMA_FONDO } from '../components/TramaFondo'

function NotFound() {
  // PageMeta ya marca noindex para rutas fuera de PUBLIC_TITLES; aquí solo el título.
  useEffect(() => {
    document.title = 'Página no encontrada · SAFE-Web'
  }, [])

  return (
    <div className={`relative min-h-screen overflow-hidden bg-canvas ${TRAMA_FONDO}`}>
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <Ticket
          className="w-full"
          talon={
            <div className="p-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-base font-medium text-on-primary hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                Volver al inicio
              </Link>
            </div>
          }
        >
          <div className="relative p-8 text-center">
            <Brand variante="logo" className="mx-auto h-10 w-auto" />
            <p className="mt-6 font-mono text-sm uppercase tracking-[0.14em] text-muted">
              Boleto nº 404
            </p>
            <p
              aria-hidden
              className="mt-2 font-display text-8xl leading-none tracking-[0.02em] text-ink"
            >
              404
            </p>
            <Sello tono="border-danger text-danger" className="mt-4">
              Sin validez
            </Sello>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
              Esta página no existe
            </h1>
            <p className="mt-3 text-base leading-relaxed text-body">
              El enlace puede estar mal escrito o la página ya no está disponible.
            </p>
          </div>
        </Ticket>
      </main>
    </div>
  )
}

export default NotFound
