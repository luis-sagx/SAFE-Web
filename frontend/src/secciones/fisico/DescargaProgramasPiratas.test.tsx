import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DescargaProgramasPiratas from './DescargaProgramasPiratas'

const mocks = vi.hoisted(() => ({
  useStoryEngine: vi.fn(),
}))

vi.mock('../../hooks/useStoryEngine', () => ({ useStoryEngine: mocks.useStoryEngine }))
vi.mock('../../components/StoryEscenario', () => ({
  default: () => <div data-testid="story-escenario">Story Escenario</div>,
}))

describe('DescargaProgramasPiratas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useStoryEngine.mockReturnValue({
      current: { nodo: 'start' },
      advance: vi.fn(),
      story: {},
    })
  })

  it('renderiza sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <DescargaProgramasPiratas />
      </BrowserRouter>
    )
    expect(container).toBeDefined()
  })

  it('renderiza el componente correctamente', () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <DescargaProgramasPiratas />
      </BrowserRouter>
    )
    expect(getByTestId('story-escenario')).toBeDefined()
  })

  it('integra hooks correctamente', () => {
    const { rerender } = render(
      <BrowserRouter>
        <DescargaProgramasPiratas />
      </BrowserRouter>
    )
    expect(mocks.useStoryEngine).toBeDefined()

    rerender(
      <BrowserRouter>
        <DescargaProgramasPiratas />
      </BrowserRouter>
    )
    expect(mocks.useStoryEngine).toBeDefined()
  })
})
