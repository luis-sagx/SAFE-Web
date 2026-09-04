import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSiguienteEscenario } from './useSiguienteEscenario'

const { fetchProgresoMock } = vi.hoisted(() => ({
  fetchProgresoMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchProgreso: fetchProgresoMock }
})

describe('useSiguienteEscenario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchProgresoMock.mockReset()
  })

  it('retorna siguiente escenario no intentado', async () => {
    fetchProgresoMock.mockResolvedValue({
      escenarios: [{ id: 'fisico/salida-segura' }],
      aprobados: 1,
      requeridos: 5,
    })

    const { result } = renderHook(() => useSiguienteEscenario('fisico/salida-segura'))

    // Esperar a que se resuelva el fetch
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current.ruta).toBe('/seccion/fisico/trampa-usb')
    expect(result.current.cargando).toBe(false)
  })

  it('retorna la sección si no hay más escenarios', async () => {
    // Mock: todos los escenarios ya fueron intentados
    const allScenarios = [
      'fisico/salida-segura',
      'fisico/trampa-usb',
      'fisico/cable-comprometido',
      'fisico/tarjeta-clonada',
      'fisico/descarga-programas-piratas',
      'fisico/puertos-frios-datacenter',
      'fisico/privacidad-claves',
      'fisico/qr-cafe-wifi',
    ]

    fetchProgresoMock.mockResolvedValue({
      escenarios: allScenarios.map((id) => ({ id })),
      aprobados: 5,
      requeridos: 5,
    })

    const { result } = renderHook(() => useSiguienteEscenario('fisico/qr-cafe-wifi'))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current.ruta).toBe('/seccion/fisico')
    expect(result.current.cargando).toBe(false)
  })

  it('usa orden del catálogo si el fetch falla', async () => {
    fetchProgresoMock.mockRejectedValue(new Error('sin red'))

    const { result } = renderHook(() => useSiguienteEscenario('fisico/salida-segura'))

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Después de salida-segura, el siguiente en orden del catálogo es trampa-usb
    expect(result.current.ruta).toBe('/seccion/fisico/trampa-usb')
    expect(result.current.cargando).toBe(false)
  })

  it('inicia con cargando=true', () => {
    fetchProgresoMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useSiguienteEscenario('fisico/baiting'))

    expect(result.current.cargando).toBe(true)
  })

  it('retorna null cuando no hay escenarios', async () => {
    const { result } = renderHook(() => useSiguienteEscenario('seccion-inexistente/scenario'))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current.ruta).toBeNull()
  })
})
