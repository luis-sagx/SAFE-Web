import { Mail, MessageSquare } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ModuleTransition from './TransicionModulo'
import type { Section } from '../data/catalogo'

const PHISHING: Section = {
  id: 'phishing',
  titulo: 'Phishing',
  descripcion: 'Correos que copian a tu banco.',
  canal: 'Correo y web',
  Icono: Mail,
}

const SMISHING: Section = {
  id: 'smishing',
  titulo: 'Smishing',
  descripcion: 'Bonos y multas falsas por SMS.',
  canal: 'SMS y WhatsApp',
  Icono: MessageSquare,
}

describe('ModuleTransition', () => {
  it('muestra el módulo aprobado, la nota y a qué módulo sigue', () => {
    render(
      <MemoryRouter>
        <ModuleTransition
          seccion={PHISHING}
          aprobados={7}
          total={8}
          siguiente={SMISHING}
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Aprobaste Phishing')).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()
    expect(screen.getByText('/8')).toBeDefined()
    expect(screen.getByText('Smishing')).toBeDefined()
    expect(screen.getByText('Bonos y multas falsas por SMS.')).toBeDefined()

    const link = screen.getByRole('link', { name: 'Ir a Smishing →' })
    expect(link.getAttribute('href')).toBe('/seccion/smishing')
  })

  it('se puede cerrar para quedarse en la pantalla anterior', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <ModuleTransition
          seccion={PHISHING}
          aprobados={7}
          total={8}
          siguiente={SMISHING}
          onClose={onClose}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Seguir aquí' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape también cierra la pantalla', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <ModuleTransition
          seccion={PHISHING}
          aprobados={7}
          total={8}
          siguiente={SMISHING}
          onClose={onClose}
        />
      </MemoryRouter>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
