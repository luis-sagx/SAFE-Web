import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { setToken } from '../lib/api'
import Bienvenida from './Bienvenida'

const { fetchMeMock, patchMeMock } = vi.hoisted(() => ({
  fetchMeMock: vi.fn(),
  patchMeMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchMe: fetchMeMock, patchMe: patchMeMock }
})

const PARTICIPANTE = {
  id: 'p1',
  nombre: 'María',
  apellido: 'Pérez',
  email: 'maria@ejemplo.com',
  role: 'PARTICIPANT',
  cohort: null,
  onboardingVisto: true,
}

/// El aviso se abre con `from` en el estado de navegación, que es lo que pone
/// el ícono ⓘ (y RequireAuth en el primer ingreso).
function renderDesde(from?: unknown) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/bienvenida', state: from === undefined ? null : { from } }]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/bienvenida" element={<Bienvenida />} />
          <Route path="/dashboard" element={<p>Panel</p>} />
          <Route path="/seccion/phishing/factura-sri" element={<p>Escenario 1</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function continuar() {
  fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }))
}

describe('Bienvenida', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchMeMock.mockReset()
    patchMeMock.mockReset()
    setToken('t0ken')
    fetchMeMock.mockResolvedValue(PARTICIPANTE)
    patchMeMock.mockResolvedValue(PARTICIPANTE)
  })

  // El motivo del issue #36: el aviso se abre desde el ícono ⓘ, que está en
  // todas las pantallas. Devolver siempre al panel le costaba al participante
  // el escenario en el que estaba.
  it('vuelve a la pantalla desde la que se abrió', async () => {
    renderDesde('/seccion/phishing/factura-sri')

    await continuar()

    expect(await screen.findByText('Escenario 1')).toBeDefined()
  })

  it('va al panel cuando no hay ruta de origen', async () => {
    renderDesde()

    await continuar()

    expect(await screen.findByText('Panel')).toBeDefined()
  })

  // `from` viaja en el estado de navegación, así que lo pone quien fabrique el
  // enlace. Una dirección externa convertiría este botón en un salto fuera de
  // la aplicación.
  it('ignora un destino que no sea una ruta interna', async () => {
    renderDesde('https://ejemplo.invalido/entrar')

    await continuar()

    expect(await screen.findByText('Panel')).toBeDefined()
  })

  it('ignora el protocolo relativo, que también sale de la aplicación', async () => {
    renderDesde('//ejemplo.invalido')

    await continuar()

    expect(await screen.findByText('Panel')).toBeDefined()
  })

  it('no se devuelve a sí misma', async () => {
    renderDesde('/bienvenida')

    await continuar()

    expect(await screen.findByText('Panel')).toBeDefined()
  })

  // El guardado es informativo: si falla, lo único que pasa es que el aviso
  // vuelva a salir. No debe dejar al participante encerrado en él.
  it('vuelve igual aunque falle el guardado', async () => {
    patchMeMock.mockRejectedValue(new Error('500'))

    renderDesde('/seccion/phishing/factura-sri')

    await continuar()

    await waitFor(() => {
      expect(screen.getByText('Escenario 1')).toBeDefined()
    })
  })
})
