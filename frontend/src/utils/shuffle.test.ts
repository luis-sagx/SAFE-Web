import { describe, expect, it, vi } from 'vitest'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('mezcla sin mutar el arreglo y usa la fuente segura del navegador', () => {
    const fuente = [1, 2, 3, 4]
    const original = [...fuente]
    const aleatorio = vi.spyOn(globalThis.crypto, 'getRandomValues')

    const resultado = shuffle(fuente)

    expect(resultado).toHaveLength(fuente.length)
    expect([...resultado].sort()).toEqual(original)
    expect(fuente).toEqual(original)
    expect(aleatorio).toHaveBeenCalled()
  })
})
