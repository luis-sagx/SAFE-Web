import { render, screen } from '@testing-library/react'
import { Landmark, School } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Navegador } from './Navegador'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ usuarioSimulado: 'mariaperez' }),
}))

describe('Navegador', () => {
  it('explica los sitios guardados y nombra cada control por la entidad que abre', () => {
    render(
      <Navegador
        pestanas={{
          correo: {
            titulo: 'Correo',
            url: 'https://correo.safeweb.com/u/0/#recibidos',
            segura: true,
          },
        }}
        abiertas={['correo']}
        activa="correo"
        marcadores={[
          { Icono: Landmark, texto: 'Banco del Litoral' },
          { Icono: School, texto: 'U.E. San Rafael', goto: 'colegio' },
        ]}
        onHotspot={() => undefined}
      >
        <p>Correo abierto</p>
      </Navegador>,
    )

    expect(screen.getByRole('navigation', { name: 'Sitios guardados' })).toBeDefined()
    expect(screen.getByText('Abre una entidad sin usar los enlaces del correo')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Abrir Banco del Litoral' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Abrir U.E. San Rafael' })).toBeDefined()
  })
})
