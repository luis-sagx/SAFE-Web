import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import NotFound from './NotFound'

describe('NotFound', () => {
  it('avisa que la página no existe y enlaza al inicio', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Esta página no existe' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Volver al inicio' }).getAttribute('href')).toBe('/')
    expect(document.title).toBe('Página no encontrada · SAFE-Web')
  })
})
