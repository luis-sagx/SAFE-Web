import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ConfirmarCorreo from './ConfirmarCorreo'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../lib/api'

const SESSION: api.Session = {
  accessToken: 'access-token',
  participant: {
    id: 'p1',
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@correo.com',
    role: 'PARTICIPANT',
    onboardingVisto: false,
  },
}

function renderWithToken(token: string | null) {
  const path = token ? `/confirmar-correo?token=${token}` : '/confirmar-correo'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
          <Route path="/dashboard" element={<p>Panel</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ConfirmarCorreo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    api.setToken(null)
  })

  it('sin token en la URL, muestra que el enlace no es válido', () => {
    renderWithToken(null)
    expect(screen.getByText(/enlace no es válido/i)).toBeDefined()
  })

  // Un escáner de enlaces que abre la página no debe gastar el token.
  it('al abrir el enlace no confirma nada hasta pulsar el botón', () => {
    const confirmEmail = vi.spyOn(api, 'confirmEmail').mockResolvedValue(SESSION)
    renderWithToken('un-token')

    expect(screen.getByRole('button', { name: 'Confirmar y entrar' })).toBeDefined()
    expect(confirmEmail).not.toHaveBeenCalled()
  })

  it('al pulsar el botón, confirma, inicia sesión y lleva al panel', async () => {
    const confirmEmail = vi.spyOn(api, 'confirmEmail').mockResolvedValue(SESSION)
    renderWithToken('un-token')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y entrar' }))

    await waitFor(() => expect(screen.getByText('Panel')).toBeDefined())
    expect(confirmEmail).toHaveBeenCalledWith('un-token')
    expect(api.getToken()).toBe('access-token')
  })

  it('con un token vencido o inválido, muestra el error del servidor', async () => {
    vi.spyOn(api, 'confirmEmail').mockRejectedValue(
      new api.ApiError('El enlace no es válido o ya venció.', 401),
    )
    renderWithToken('un-token-vencido')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y entrar' }))

    await waitFor(() =>
      expect(screen.getByText('El enlace no es válido o ya venció.')).toBeDefined(),
    )
    expect(screen.getByRole('link', { name: /pedir un enlace nuevo/i })).toBeDefined()
  })

  it('mientras confirma, el botón queda deshabilitado para no gastar el token dos veces', () => {
    const confirmEmail = vi
      .spyOn(api, 'confirmEmail')
      .mockReturnValue(new Promise<api.Session>(() => {}))
    renderWithToken('un-token')

    const button = screen.getByRole('button', { name: 'Confirmar y entrar' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(confirmEmail).toHaveBeenCalledTimes(1)
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })
})
