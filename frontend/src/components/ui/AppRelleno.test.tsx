import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AppRelleno from './AppRelleno'

describe('AppRelleno', () => {
  it('muestra una cuenta y movimientos en la app bancaria', () => {
    render(<AppRelleno tipo="banco" />)

    expect(screen.getByText('Cuenta de ahorros')).toBeDefined()
    expect(screen.getByText('$312,45')).toBeDefined()
    expect(screen.getByText('Transferencia recibida')).toBeDefined()
  })

  it('presenta recuerdos variados en la galería', () => {
    render(<AppRelleno tipo="galeria" />)

    expect(screen.getByText('Recuerdos')).toBeDefined()
    expect(screen.getByText('Parque')).toBeDefined()
    expect(screen.getByText('Café')).toBeDefined()
    expect(screen.getByText('Familia')).toBeDefined()
  })
})
