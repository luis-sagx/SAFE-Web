import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StoryChoice } from '../../hooks/useStoryEngine'
import StoryChoices from './StoryChoices'

describe('StoryChoices', () => {
  it('renderiza sin errores', () => {
    const choices: StoryChoice[] = [
      { label: 'Opción 1', goto: 'n1' },
      { label: 'Opción 2', goto: 'n2' },
    ]

    const { container } = render(<StoryChoices choices={choices} onChoose={vi.fn()} />)

    expect(container).toBeDefined()
    expect(container.querySelectorAll('button')).toHaveLength(2)
  })

  it('renderiza lista vacía correctamente', () => {
    const { container } = render(<StoryChoices choices={[]} onChoose={vi.fn()} />)

    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})
