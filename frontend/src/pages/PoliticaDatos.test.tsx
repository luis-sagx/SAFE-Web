import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import PoliticaDatos from './PoliticaDatos'

describe('PoliticaDatos', () => {
  it('renderiza la página de política de datos', () => {
    const { container } = render(
      <BrowserRouter>
        <PoliticaDatos />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
    expect(screen.getByText('Política de Datos')).toBeDefined()
  })

  it('muestra todos los títulos de secciones', () => {
    render(
      <BrowserRouter>
        <PoliticaDatos />
      </BrowserRouter>
    )
    expect(screen.getByText(/1\. Recopilación de Información/)).toBeDefined()
    expect(screen.getByText(/2\. Uso de la Información/)).toBeDefined()
    expect(screen.getByText(/3\. Protección de Datos/)).toBeDefined()
    expect(screen.getByText(/4\. Anonimización de Resultados/)).toBeDefined()
    expect(screen.getByText(/5\. Derechos de Acceso y Control/)).toBeDefined()
  })

  it('muestra el enlace para volver al inicio', () => {
    render(
      <BrowserRouter>
        <PoliticaDatos />
      </BrowserRouter>
    )
    const volverLink = screen.getByText('← Volver')
    expect(volverLink).toBeDefined()
  })

  it('muestra información de contacto', () => {
    render(
      <BrowserRouter>
        <PoliticaDatos />
      </BrowserRouter>
    )
    expect(screen.getByText('soporte@safe-web.com')).toBeDefined()
  })
})
