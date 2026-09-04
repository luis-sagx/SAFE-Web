import { describe, expect, it } from 'vitest'
import BasuraConfidencial from './BasuraConfidencial'

describe('BasuraConfidencial', () => {
  it('exports component', () => {
    expect(BasuraConfidencial).toBeDefined()
    expect(typeof BasuraConfidencial).toBe('function')
  })
})
