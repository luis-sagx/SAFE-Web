import { describe, expect, it } from 'vitest'
import CableComprometido from './CableComprometido'

describe('CableComprometido', () => {
  it('exports component', () => {
    expect(CableComprometido).toBeDefined()
    expect(typeof CableComprometido).toBe('function')
  })
})
