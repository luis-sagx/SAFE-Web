import { fireEvent, render, screen } from '@testing-library/react'
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

  it('llama onChoose cuando se hace click en una opción', () => {
    const onChoose = vi.fn()
    const choices: StoryChoice[] = [
      { label: 'Opción 1', goto: 'n1' },
      { label: 'Opción 2', goto: 'n2' },
    ]

    render(<StoryChoices choices={choices} onChoose={onChoose} />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0] as HTMLElement)

    expect(onChoose).toHaveBeenCalledWith('n1', 'Opción 1')
  })

  it('renderiza todas las opciones con sus labels', () => {
    const choices: StoryChoice[] = [
      { label: 'Aceptar', goto: 'e_accept' },
      { label: 'Rechazar', goto: 'e_reject' },
      { label: 'Reportar', goto: 'e_report' },
    ]

    render(<StoryChoices choices={choices} onChoose={vi.fn()} />)

    expect(screen.getByText('Aceptar')).toBeDefined()
    expect(screen.getByText('Rechazar')).toBeDefined()
    expect(screen.getByText('Reportar')).toBeDefined()
  })

  it('pasa goto correcto al callback', () => {
    const onChoose = vi.fn()
    const choices: StoryChoice[] = [
      { label: 'Opción A', goto: 'node-a' },
      { label: 'Opción B', goto: 'node-b' },
    ]

    render(<StoryChoices choices={choices} onChoose={onChoose} />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1] as HTMLElement)

    expect(onChoose).toHaveBeenCalledWith('node-b', 'Opción B')
  })
})
