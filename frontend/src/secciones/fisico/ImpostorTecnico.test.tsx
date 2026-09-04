import { describe, expect, it } from 'vitest'
import ImpostorTecnico from './ImpostorTecnico'

describe('ImpostorTecnico', () => {
  it('exports component', () => {
    expect(ImpostorTecnico).toBeDefined()
    expect(typeof ImpostorTecnico).toBe('function')
  })
})
