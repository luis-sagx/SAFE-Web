import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ScratchTicket from './BoletoRaspable'

function renderTicket() {
  return render(
    <ScratchTicket pista={<span>$1.200</span>} accion="Revelar las señales">
      <p>La dirección no es del Estado</p>
    </ScratchTicket>,
  )
}

describe('BoletoRaspable', () => {
  it('mantiene lo tapado dentro del documento: el foil solo cubre a la vista', () => {
    const { container } = renderTicket()

    expect(screen.getByText('La dirección no es del Estado')).toBeDefined()
    expect(container.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('el botón revela sin raspar, para teclado y motricidad reducida', () => {
    const { container } = renderTicket()

    fireEvent.click(screen.getByRole('button', { name: 'Revelar las señales' }))

    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Revelar las señales' })).toBeNull()
    expect(screen.getByText('La dirección no es del Estado')).toBeDefined()
  })
})
