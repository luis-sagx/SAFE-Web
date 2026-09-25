import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import TermsOfUse from './TermsOfUse'

describe('TermsOfUse', () => {
  it('tiene índice lateral con las secciones, como la política', () => {
    render(
      <MemoryRouter>
        <TermsOfUse />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Términos de uso' })).toBeDefined()
    const [indice] = screen.getAllByRole('navigation', { name: 'Contenido' })
    expect(indice?.querySelector('a[href="#simulaciones"]')).not.toBeNull()
    expect(screen.getByRole('link', { name: '← Volver' }).getAttribute('href')).toBe('/registro')
  })
})
