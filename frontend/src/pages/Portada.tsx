import { Link } from 'react-router'
import AppHeader from '../components/AppHeader'
import VideoCapacitacion from '../components/VideoCapacitacion'
import { useAuth } from '../context/AuthContext'
import { TRAINING_VIDEOS } from '../data/videosCapacitacion'

function Portada() {
  const { isAuthenticated, isAdmin } = useAuth()
  const general = TRAINING_VIDEOS[0]
  const modules = TRAINING_VIDEOS.slice(1)
  let destination = { to: '/dashboard', label: 'Ir a mi entrenamiento' }
  if (!isAuthenticated) {
    destination = { to: '/login', label: 'Iniciar sesión' }
  } else if (isAdmin) {
    destination = { to: '/admin', label: 'Ir a administración' }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.88px] text-muted">Capacitación</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
            Aprende a usar SAFE-Web
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-body">
            SAFE-Web es un entorno de práctica con situaciones simuladas para reconocer engaños y decidir cómo verificarlos. Puedes revisar los videos antes o después de los escenarios; verlos no cambia tu avance.
          </p>
          <Link
            to={destination.to}
            className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2.5 font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {destination.label}
          </Link>
        </section>

        {general && (
          <section aria-labelledby="video-general" className="mt-12 max-w-3xl">
            <h2 id="video-general" className="text-2xl font-semibold tracking-tight text-ink">
              Empieza por aquí
            </h2>
            <div className="mt-4">
              <VideoCapacitacion video={general} />
            </div>
          </section>
        )}

        <section aria-labelledby="videos-modulos" className="mt-12">
          <h2 id="videos-modulos" className="text-2xl font-semibold tracking-tight text-ink">
            Videos por módulo
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-body">
            Cada video te ayuda a preparar la conversación sobre las señales y decisiones que aparecen en el módulo.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((video) => <VideoCapacitacion key={video.id} video={video} />)}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Portada
