import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import PageMeta, { SITE_TITLE } from './PageMeta'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <PageMeta />
    </MemoryRouter>,
  )
  return document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content
}

describe('PageMeta', () => {
  it('la portada se indexa con el título del sitio', () => {
    expect(renderAt('/')).toBe('index, follow')
    expect(document.title).toBe(SITE_TITLE)
  })

  it('una página pública tiene su propio título', () => {
    expect(renderAt('/terminos')).toBe('index, follow')
    expect(document.title).toBe('Términos de uso · SAFE-Web')
  })

  it.each(['/admin', '/dashboard', '/verificar/SW-ABCD-1234', '/restablecer-password'])(
    '%s no se indexa',
    (path) => {
      expect(renderAt(path)).toBe('noindex, nofollow')
    },
  )
})
