import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RevisaTuCorreo from './RevisaTuCorreo'
import * as api from '../lib/api'

function renderWithState(email: string | undefined) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/revisa-tu-correo', state: email ? { email } : undefined }]}
    >
      <Routes>
        <Route path="/revisa-tu-correo" element={<RevisaTuCorreo />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RevisaTuCorreo', () => {
  it('muestra el correo al que se mandó la confirmación', () => {
    renderWithState('ana@correo.com')
    expect(screen.getByText(/ana@correo\.com/)).toBeDefined()
  })

  it('sin correo en el estado (entrada directa), muestra un mensaje genérico sin reventar', () => {
    renderWithState(undefined)
    expect(screen.getByText(/revisa tu correo/i)).toBeDefined()
  })

  it('el botón de reenviar llama a resendConfirmation con el correo', async () => {
    const resendConfirmation = vi.spyOn(api, 'resendConfirmation').mockResolvedValue(null)
    renderWithState('ana@correo.com')

    fireEvent.click(screen.getByRole('button', { name: /reenviar/i }))

    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith('ana@correo.com'))
  })

  // Sin `state.email` (recarga, entrada directa a la URL, o el enlace
  // "Pedir un enlace nuevo" de ConfirmarCorreo): tiene que existir un
  // formulario con el que pedir el reenvío, o una cuenta con el link vencido
  // queda bloqueada para siempre (issue de la revisión final).
  it('sin correo en el estado, muestra un formulario que llama a resendConfirmation', async () => {
    const resendConfirmation = vi.spyOn(api, 'resendConfirmation').mockResolvedValue(null)
    renderWithState(undefined)

    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: 'ana@correo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reenviar enlace/i }))

    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith('ana@correo.com'))
    expect(screen.getByText(/si ese correo tiene una cuenta/i)).toBeDefined()
  })

  it('sin correo en el estado, un formato inválido no llama a resendConfirmation', () => {
    const resendConfirmation = vi.spyOn(api, 'resendConfirmation').mockResolvedValue(null)
    renderWithState(undefined)

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'no-es-un-correo' } })
    fireEvent.click(screen.getByRole('button', { name: /reenviar enlace/i }))

    expect(resendConfirmation).not.toHaveBeenCalled()
    expect(screen.getByText(/formato válido/i)).toBeDefined()
  })
})
