import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LegalPage from './LegalPage'

const SECTIONS = [
  { id: 'uno', title: 'Uno', body: <p>a</p> },
  { id: 'dos', title: 'Dos', body: <p>b</p> },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LegalPage', () => {
  it('marca en el índice la sección que se está leyendo y la mueve a la vista', () => {
    let notify: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {}
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof notify) {
          notify = callback
        }
        observe = observe
        disconnect = vi.fn()
      },
    )
    const scrollTo = vi.fn()
    const original = HTMLElement.prototype.scrollTo
    HTMLElement.prototype.scrollTo = scrollTo

    render(
      <MemoryRouter>
        <LegalPage title="Legal" lastUpdated="hoy" sections={SECTIONS} />
      </MemoryRouter>,
    )
    expect(observe).toHaveBeenCalledTimes(2)

    act(() => notify([{ isIntersecting: true, target: document.getElementById('dos') as Element }]))

    const [sidebar] = screen.getAllByRole('navigation', { name: 'Contenido' })
    expect(sidebar?.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe('#dos')
    expect(scrollTo).toHaveBeenCalled()
    HTMLElement.prototype.scrollTo = original
  })
})
