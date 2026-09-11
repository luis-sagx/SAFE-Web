import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CuerpoCorreo } from './DesktopChrome'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ correoSimulado: 'mariaperez@safeweb.com' }),
}))

describe('CuerpoCorreo', () => {
  it('presenta la identidad visual declarada por el remitente sin reemplazar el contenido', () => {
    render(
      <CuerpoCorreo
        asunto="Aviso importante"
        remitente={{ nombre: 'TiendaExpress', direccion: 'seguridad@tiendaexpress.com.ec' }}
        recibido="hoy 08:15"
        marca={{
          nombre: 'TiendaExpress',
          detalle: 'Seguridad de la información',
          icono: 'tienda',
          variante: 'seguridad',
        }}
      >
        <p>Contenido que debe seguir disponible.</p>
      </CuerpoCorreo>,
    )

    const marca = screen.getByRole('group', { name: 'Identidad visual de TiendaExpress' })
    expect(marca.textContent).toContain('TiendaExpress')
    expect(marca.textContent).toContain('Seguridad de la información')
    expect(screen.getByText('Contenido que debe seguir disponible.')).toBeDefined()
  })
})
