import { describe, expect, it } from 'vitest'
import ConexionPublica from './ConexionPublica'

describe('ConexionPublica', () => {
  it('exports component', () => {
    expect(ConexionPublica).toBeDefined()
    expect(typeof ConexionPublica).toBe('function')
  })
})
