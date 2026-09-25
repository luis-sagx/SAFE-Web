import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTACTS, PROJECT_TITLE } from '../data/proyecto'
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
    expect(screen.getByRole('heading', { name: /^1\. Un proyecto académico/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Responsables del tratamiento/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Qué datos recogemos/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Seudonimización y uso en la investigación/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /\d+\. Tus derechos/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Menores de edad/ })).toBeDefined()
  })

  it('muestra el enlace para volver al inicio', () => {
    renderPolicy()
    expect(screen.getByText('← Volver')).toBeDefined()
  })

  it('muestra cada correo de contacto una sola vez, tomado de data/proyecto', () => {
    renderPolicy()
    for (const { email } of CONTACTS) {
      const links = screen.getAllByRole('link', { name: email })
      expect(links).toHaveLength(1)
      expect(links[0]?.getAttribute('href')).toBe(`mailto:${email}`)
    }
  })

  it('aclara que es un proyecto académico de titulación', () => {
    const { container } = renderPolicy()
    expect(container.textContent).toContain(PROJECT_TITLE)
    expect(screen.getByRole('link', { name: 'términos de uso' }).getAttribute('href')).toBe('/terminos')
  })

  it('usa una fecha de actualización fija, no la del día', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
    renderPolicy()
    expect(screen.getByText('Última actualización: 25 de septiembre de 2026')).toBeDefined()
  })
})
