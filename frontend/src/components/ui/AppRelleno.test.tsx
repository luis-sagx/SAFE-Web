import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AppRelleno from './AppRelleno'

describe('AppRelleno', () => {
  it('muestra una cuenta y movimientos en la app bancaria', () => {
    render(<AppRelleno tipo="banco" />)

    expect(screen.getByText('Banco del Litoral')).toBeDefined()
    expect(screen.getByText(/Cuenta de ahorros/)).toBeDefined()
    expect(screen.getByText('$312,45')).toBeDefined()
    expect(screen.getByText('Transferencia recibida')).toBeDefined()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryAllByText(/^(Transferir|Pagar|Tarjetas)$/)).toHaveLength(0)
  })

  it('el navegador abre en Nueva pestaña con sus sitios frecuentes', () => {
    render(<AppRelleno tipo="navegador" />)

    expect(screen.getByText('Nueva pestaña')).toBeDefined()
    expect(screen.getByText('Sitios frecuentes')).toBeDefined()
    expect(screen.getByText('inclusion.gob.ec')).toBeDefined()
  })

  it('presenta recuerdos variados en la galería', () => {
    render(<AppRelleno tipo="galeria" />)

    expect(screen.getByText('Recuerdos')).toBeDefined()
    expect(screen.getByText('Parque')).toBeDefined()
    expect(screen.getByText('Café')).toBeDefined()
    expect(screen.getByText('Familia')).toBeDefined()
    expect(screen.queryAllByText(/^(248 elementos|Seleccionar|Recientes|Álbumes|Flores|Ciudad|Montañas)$/)).toHaveLength(0)
  })
})
