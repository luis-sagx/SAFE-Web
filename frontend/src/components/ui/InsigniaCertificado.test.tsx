import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import InsigniaCertificado from './InsigniaCertificado'

describe('InsigniaCertificado', () => {
  it('muestra el nombre y la cantidad de módulos como una insignia circular', () => {
    const { container } = render(
      <InsigniaCertificado nombre="Sebastián Parra" modulos={['phishing', 'smishing', 'vishing']} horas={4} />,
    )

    expect(screen.getByText('Sebastián Parra')).toBeDefined()
    expect(screen.getByText(/3 módulos/)).toBeDefined()

    const svg = container.querySelector('svg[data-insignia]')
    expect(svg).not.toBeNull()
    // Círculo, no rectángulo: es lo que la distingue de una tarjeta o del PDF.
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0)
  })

  it('con un solo módulo, usa el singular', () => {
    render(<InsigniaCertificado nombre="Ana" modulos={['phishing']} horas={4} />)
    expect(screen.getByText(/1 módulo\b/)).toBeDefined()
  })

  it('sin nombre, muestra un texto neutro en vez de dejarlo vacío', () => {
    render(<InsigniaCertificado nombre={null} modulos={['phishing']} horas={4} />)
    expect(screen.getByText('Participante SAFE-Web')).toBeDefined()
  })
})
