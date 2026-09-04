import { describe, expect, it } from 'vitest'
import USBPromocional from './USBPromocional'

describe('USBPromocional', () => {
  it('exports component', () => {
    expect(USBPromocional).toBeDefined()
    expect(typeof USBPromocional).toBe('function')
  })
})
