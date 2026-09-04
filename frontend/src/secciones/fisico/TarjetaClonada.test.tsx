import { describe, expect, it } from 'vitest'
import TarjetaClonada from './TarjetaClonada'

describe('TarjetaClonada', () => {
  it('exports component', () => {
    expect(TarjetaClonada).toBeDefined()
    expect(typeof TarjetaClonada).toBe('function')
  })
})
