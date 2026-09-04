import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFlashTransition } from './useFlashTransition'

describe('useFlashTransition', () => {
  it('retorna un objeto con active y trigger', () => {
    const { result } = renderHook(() => useFlashTransition())
    expect(result.current).toHaveProperty('active')
    expect(result.current).toHaveProperty('trigger')
  })

  it('active comienza en false', () => {
    const { result } = renderHook(() => useFlashTransition())
    expect(result.current.active).toBe(false)
  })

  it('trigger es una función', () => {
    const { result } = renderHook(() => useFlashTransition())
    expect(typeof result.current.trigger).toBe('function')
  })

  it('trigger acepta una función callback', () => {
    const { result } = renderHook(() => useFlashTransition())
    const callback = vi.fn()
    expect(() => result.current.trigger(callback)).not.toThrow()
  })

  it('trigger acepta un delay personalizado', () => {
    const { result } = renderHook(() => useFlashTransition())
    const callback = vi.fn()
    expect(() => result.current.trigger(callback, 500)).not.toThrow()
  })

  it('trigger funciona sin callback', () => {
    const { result } = renderHook(() => useFlashTransition())
    expect(() => result.current.trigger()).not.toThrow()
  })

  it('acepta callback y delay personalizado', () => {
    const { result } = renderHook(() => useFlashTransition())
    const callback = vi.fn()
    expect(() => result.current.trigger(callback, 500)).not.toThrow()
  })

  it('maneja múltiples llamadas a trigger', () => {
    const { result } = renderHook(() => useFlashTransition())
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    expect(() => {
      result.current.trigger(callback1)
      result.current.trigger(callback2)
    }).not.toThrow()
  })
})
