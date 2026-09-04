import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FlashOverlay from './FlashOverlay'

describe('FlashOverlay', () => {
  it('renderiza sin errores cuando active es false', () => {
    const { container } = render(<FlashOverlay active={false} />)
    expect(container).toBeDefined()
  })

  it('renderiza sin errores cuando active es true', () => {
    const { container } = render(<FlashOverlay active={true} />)
    expect(container).toBeDefined()
  })

  it('aplica clase active cuando active es true', () => {
    const { container } = render(<FlashOverlay active={true} />)
    const div = container.querySelector('div')
    expect(div?.className).toContain('active')
  })

  it('no aplica clase active cuando active es false', () => {
    const { container } = render(<FlashOverlay active={false} />)
    const div = container.querySelector('div')
    expect(div?.className).not.toContain('active')
  })
})
