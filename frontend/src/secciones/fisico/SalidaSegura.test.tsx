import { describe, expect, it } from 'vitest'
import SalidaSegura from './SalidaSegura'

describe('SalidaSegura', () => {
  it('exports component', () => {
    expect(SalidaSegura).toBeDefined()
    expect(typeof SalidaSegura).toBe('function')
  })
})
