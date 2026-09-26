import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { KeyRound } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog, { type Confirmation } from './ConfirmDialog'

function confirmation(accion: Confirmation['accion']): Confirmation {
  return { titulo: '¿Restablecer?', mensaje: 'Se generará otra.', etiqueta: 'Sí, restablecer', Icono: KeyRound, accion }
}

describe('ConfirmDialog', () => {
  it('cancelar cierra sin ejecutar la acción', async () => {
    const accion = vi.fn(() => Promise.resolve())
    const onClose = vi.fn()
    render(<ConfirmDialog confirmation={confirmation(accion)} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'No, cancelar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(accion).not.toHaveBeenCalled()
  })

  it('confirmar ejecuta la acción y cierra al terminar bien', async () => {
    const accion = vi.fn(() => Promise.resolve())
    const onClose = vi.fn()
    render(<ConfirmDialog confirmation={confirmation(accion)} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(accion).toHaveBeenCalledTimes(1)
  })

  it('si la acción falla, sigue abierto y muestra el error', async () => {
    const onClose = vi.fn()
    render(<ConfirmDialog confirmation={confirmation(() => Promise.reject(new Error('Sin conexión')))} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Sin conexión')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sí, restablecer' })).toHaveProperty('disabled', false)
  })

  it('Escape cierra', async () => {
    const onClose = vi.fn()
    render(<ConfirmDialog confirmation={confirmation(() => Promise.resolve())} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
