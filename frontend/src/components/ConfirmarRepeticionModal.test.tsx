import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ConfirmReplayModal from './ConfirmarRepeticionModal'

function renderModal(props: Partial<React.ComponentProps<typeof ConfirmReplayModal>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(
    <MemoryRouter>
      <ConfirmReplayModal
        titulo="Seguridad física"
        aprobados={6}
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onClose, onConfirm }
}

describe('ConfirmarRepeticionModal', () => {
  it('avisa que la nota actual se reinicia en cero y los intentos dejan de contar', () => {
    renderModal()
    expect(screen.getByText('0/8')).toBeDefined()
    expect(screen.getByText(/ya no cuentan para la nota/)).toBeDefined()
  })

  it('confirma y cierra con los callbacks recibidos', () => {
    const { onClose, onConfirm } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar módulo' }))
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
