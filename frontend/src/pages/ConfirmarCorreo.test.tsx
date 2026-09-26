import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ConfirmarCorreo from './ConfirmarCorreo'
import * as api from '../lib/api'

function renderWithToken(token: string | null) {
  const path = token ? `/confirmar-correo?token=${token}` : '/confirmar-correo'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/confirmar-correo" element={<ConfirmarCorreo />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ConfirmarCorreo', () => {
  it('sin token en la URL, muestra que el enlace no es válido', () => {
    renderWithToken(null)
    expect(screen.getByText(/enlace no es válido/i)).toBeDefined()
  })

  it('con un token válido, confirma y muestra éxito', async () => {
    vi.spyOn(api, 'confirmEmail').mockResolvedValue(null)
    renderWithToken('un-token')

    await waitFor(() => expect(screen.getByText(/confirmamos tu correo/i)).toBeDefined())
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeDefined()
  })

  it('con un token vencido o inválido, muestra el error del servidor', async () => {
    vi.spyOn(api, 'confirmEmail').mockRejectedValue(
      new api.ApiError('El enlace no es válido o ya venció.', 401),
    )
    renderWithToken('un-token-vencido')

    await waitFor(() =>
      expect(screen.getByText('El enlace no es válido o ya venció.')).toBeDefined(),
    )
  })

  // Confirmar no es idempotente (el backend borra el token al primer uso), a
  // diferencia de verificar un certificado. <StrictMode> dispara el efecto
  // dos veces en desarrollo; sin compartir la petición en vuelo, la segunda
  // llamada llegaría con el token ya borrado y el backend respondería 401
  // aunque la cuenta ya hubiera quedado confirmada (issue de la revisión
  // final).
  it('con el mismo token, dos montajes casi simultáneos comparten una sola petición', async () => {
    const confirmEmail = vi.spyOn(api, 'confirmEmail').mockResolvedValue(null)

    // Simula lo que hace StrictMode: monta, desmonta de inmediato (sin
    // esperar a que la promesa resuelva) y vuelve a montar con el mismo token.
    const first = renderWithToken('mismo-token')
    first.unmount()
    renderWithToken('mismo-token')

    await waitFor(() => expect(screen.getByText(/confirmamos tu correo/i)).toBeDefined())
    expect(confirmEmail).toHaveBeenCalledTimes(1)
  })
})
