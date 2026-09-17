import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataPolicy from './PoliticaDatos'

function renderPolicy() {
  return render(
    <BrowserRouter>
      <DataPolicy />
    </BrowserRouter>
  )
}

describe('PoliticaDatos', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renderiza la página de política de datos', () => {
    renderPolicy()
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Datos' })).toBeDefined()
  })

  it('muestra los títulos de secciones numerados', () => {
    renderPolicy()
    expect(screen.getByRole('heading', { name: /^1\. Responsables del tratamiento/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Qué datos recogemos/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Seudonimización y uso en la investigación/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /\d+\. Tus derechos/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Menores de edad/ })).toBeDefined()
  })

  it('muestra el enlace para volver al inicio', () => {
    renderPolicy()
    expect(screen.getByText('← Volver')).toBeDefined()
  })

  it('muestra los correos de contacto de los responsables', () => {
    renderPolicy()
    expect(screen.getAllByRole('link', { name: 'luis@gmail.com' })[0]?.getAttribute('href')).toBe(
      'mailto:luis@gmail.com'
    )
    expect(screen.getAllByRole('link', { name: 'sebas@gmail.com' }).length).toBeGreaterThan(0)
  })

  it('usa una fecha de actualización fija, no la del día', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
    renderPolicy()
    expect(screen.getByText('Última actualización: 16 de septiembre de 2026')).toBeDefined()
  })
})
