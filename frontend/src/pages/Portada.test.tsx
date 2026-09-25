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

  it('presenta la promesa, las señales del ejemplo y los dos videos publicados', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(screen.getByText(/engaños simulados/i)).toBeDefined()
    expect(screen.getByText('Ningún premio necesita tu clave')).toBeDefined()
    // Solo el general y phishing publican reproductor; los demás módulos
    // muestran que su video se publica pronto.
    expect(screen.getAllByRole('button', { name: /^Reproducir / })).toHaveLength(2)
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
})
