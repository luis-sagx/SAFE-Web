import { describe, expect, it } from 'vitest'
import TecnicoImpostor from './TecnicoImpostor'

describe('TecnicoImpostor', () => {
  it('exports component', () => {
    expect(TecnicoImpostor).toBeDefined()
    expect(typeof TecnicoImpostor).toBe('function')
  })
})
