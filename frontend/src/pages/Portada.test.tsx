import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Portada from './Portada'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../context/AuthContext', () => ({ useAuth: useAuthMock }))
vi.mock('../components/AppHeader', () => ({ default: () => <header>SAFE-Web</header> }))
vi.mock('../components/SelectorTema', () => ({ default: () => <div>Tema</div> }))

function renderPage() {
  render(
    <MemoryRouter>
      <Portada />
    </MemoryRouter>,
  )
}

/** La portada repite la acción principal arriba y al cierre. */
function destinations(name: string) {
  return screen.getAllByRole('link', { name }).map((link) => link.getAttribute('href'))
}

describe('Portada', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isAdmin: false })
  })

  it('presenta la promesa, las señales del ejemplo y los ocho videos', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(screen.getByText(/engaños simulados/i)).toBeDefined()
    expect(screen.getByText('Ningún premio necesita tu clave')).toBeDefined()
    // Ocho espacios de video: el general es un boleto entero y los siete
    // módulos son filas de la tira. Cada uno monta su reproductor al pedirlo.
    expect(screen.getAllByRole('button', { name: /^Reproducir / })).toHaveLength(8)
  })

  it('las señales están en el documento aunque nadie raspe el boleto', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Revelar las señales' })).toBeDefined()
    expect(screen.getByText('La dirección no es del Estado')).toBeDefined()
  })

  it('manda a una persona visitante a iniciar sesión', () => {
    renderPage()

    expect(destinations('Entrar al entrenamiento')).toEqual(['/login', '/login'])
  })

  it('lleva a un participante autenticado a su entrenamiento', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isAdmin: false })
    renderPage()

    expect(destinations('Ir a mi entrenamiento')).toEqual(['/dashboard', '/dashboard'])
  })

  it('lleva a un administrador autenticado a administración', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, isAdmin: true })
    renderPage()

    expect(destinations('Ir a administración')).toEqual(['/admin', '/admin'])
  })
  it('el contador dice la verdad cuando todavía no hay ningún video grabado', async () => {
    vi.resetModules()
    vi.doMock('../data/videosCapacitacion', async () => {
      const real = await vi.importActual<typeof import('../data/videosCapacitacion')>(
        '../data/videosCapacitacion',
      )
      return {
        ...real,
        TRAINING_VIDEOS: real.TRAINING_VIDEOS.map((video) => ({ ...video, youtubeUrl: null })),
      }
    })
    const { default: PortadaSinVideos } = await import('./Portada')

    render(
      <MemoryRouter>
        <PortadaSinVideos />
      </MemoryRouter>,
    )

    expect(screen.getByText(/videos en preparación/i)).toBeDefined()
    vi.doUnmock('../data/videosCapacitacion')
    vi.resetModules()
  })

  it('el contador distingue cuántos videos existen ya de cuántos faltan', async () => {
    vi.resetModules()
    vi.doMock('../data/videosCapacitacion', async () => {
      const real = await vi.importActual<typeof import('../data/videosCapacitacion')>(
        '../data/videosCapacitacion',
      )
      return {
        ...real,
        TRAINING_VIDEOS: real.TRAINING_VIDEOS.map((video, index) => ({
          ...video,
          youtubeUrl: index < 3 ? 'https://youtu.be/abcdefghijk' : null,
        })),
      }
    })
    const { default: PortadaParcial } = await import('./Portada')

    render(
      <MemoryRouter>
        <PortadaParcial />
      </MemoryRouter>,
    )

    expect(screen.getByText('3 de 8 videos')).toBeDefined()
    vi.doUnmock('../data/videosCapacitacion')
    vi.resetModules()
  })
})
