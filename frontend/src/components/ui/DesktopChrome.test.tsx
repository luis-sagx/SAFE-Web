import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmailBody } from './DesktopChrome'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ correoSimulado: 'mariaperez@safeweb.com' }),
}))

describe('CuerpoCorreo', () => {
  it('presenta la identidad visual declarada por el remitente sin reemplazar el contenido', () => {
    render(
      <EmailBody
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
      </EmailBody>,
    )

    const brand = screen.getByRole('group', { name: 'Identidad visual de TiendaExpress' })
    expect(brand.textContent).toContain('TiendaExpress')
    expect(brand.textContent).toContain('Seguridad de la información')
    expect(screen.getByText('Contenido que debe seguir disponible.')).toBeDefined()
  })

  it('etiqueta explícitamente quién envía y quién recibe el mensaje', () => {
    render(
      <EmailBody
        asunto="Aviso"
        remitente={{ nombre: 'Banco del Litoral', direccion: 'notificaciones@bancodel1itoral.com' }}
        recibido="hoy 08:15"
        destinatario="luissagnay@safeweb.com"
      >
        <p>Mensaje de prueba.</p>
      </EmailBody>,
    )

    expect(screen.getByText('de: notificaciones@bancodel1itoral.com')).toBeDefined()
    expect(screen.getByText('para: luissagnay@safeweb.com')).toBeDefined()
  })
})
