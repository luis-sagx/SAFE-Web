import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ConfirmarRepeticionModal from './ConfirmarRepeticionModal'

function renderModal(props: Partial<React.ComponentProps<typeof ConfirmarRepeticionModal>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(
    <MemoryRouter>
      <ConfirmarRepeticionModal
        seccionId="fisico"
        titulo="Seguridad física"
        aprobados={6}
        aprobado
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onClose, onConfirm }
}

describe('ConfirmarRepeticionModal', () => {
  it('avisa de que cuenta la última ronda solo si ya está aprobado', () => {
    renderModal({ aprobado: false })
    expect(screen.queryByText(/última/)).toBeNull()
  })

  it('muestra el aviso de la última ronda cuando está aprobado', () => {
    renderModal({ aprobado: true })
    expect(screen.getByText(/última/)).toBeDefined()
  })

  it('confirma y cierra con los callbacks recibidos', () => {
    const { onClose, onConfirm } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Empezar la repetición' }))
    expect(onConfirm).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cierra al pulsar Escape', () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
