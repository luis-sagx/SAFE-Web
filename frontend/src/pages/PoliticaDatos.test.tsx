import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import DataPolicy from './PoliticaDatos'

describe('PoliticaDatos', () => {
  it('renderiza la página de política de datos', () => {
    const { container } = render(
      <BrowserRouter>
        <DataPolicy />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
    expect(screen.getByText('Política de Datos')).toBeDefined()
  })

  it('muestra todos los títulos de secciones', () => {
    render(
      <BrowserRouter>
        <DataPolicy />
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
        <DataPolicy />
      </BrowserRouter>
    )
    const backLink = screen.getByText('← Volver')
    expect(backLink).toBeDefined()
  })

  it('muestra información de contacto', () => {
    render(
      <BrowserRouter>
        <DataPolicy />
      </BrowserRouter>
    )
    expect(screen.getByText('soporte@safe-web.com')).toBeDefined()
  })
})
