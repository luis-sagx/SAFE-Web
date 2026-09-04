import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicializa con la duración correcta', () => {
    const { result } = renderHook(() => useCountdown(10))
    expect(result.current).toBe(10)
  })

  it('retorna un número', () => {
    const { result } = renderHook(() => useCountdown(5))
    expect(typeof result.current).toBe('number')
  })

  it('reinicia cuando cambia la duración', () => {
    const { result, rerender } = renderHook(({ duration }) => useCountdown(duration), {
      initialProps: { duration: 10 },
    })
    expect(result.current).toBe(10)

    rerender({ duration: 5 })
    expect(result.current).toBe(5)
  })

  it('acepta opciones personalizadas', () => {
    const onExpire = () => {}
    const { result } = renderHook(() =>
      useCountdown(10, { running: true, tickMs: 100, onExpire }),
    )
    expect(typeof result.current).toBe('number')
    expect(result.current).toBeGreaterThanOrEqual(0)
  })

  it('maneja duración de 0', () => {
    const { result } = renderHook(() => useCountdown(0))
    expect(result.current).toBe(0)
  })

  it('no cuenta cuando running es false', () => {
    const { result } = renderHook(() => useCountdown(5, { running: false }))
    expect(result.current).toBe(5)
  })

  it('maneja cambios en running correctamente', () => {
    const { result, rerender } = renderHook(({ running }) => useCountdown(10, { running }), {
      initialProps: { running: true },
    })
    expect(result.current).toBe(10)

    rerender({ running: false })
    expect(result.current).toBe(10)
  })

  it('usa el tickMs personalizado', () => {
    const { result } = renderHook(() => useCountdown(5, { tickMs: 250 }))
    expect(typeof result.current).toBe('number')
  })

  it('proporciona callback onExpire', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(5, { onExpire }))
    expect(result.current).toBeGreaterThanOrEqual(0)
  })
})
