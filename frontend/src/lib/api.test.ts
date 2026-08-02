import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createRun, fetchMe, getToken, login, setToken } from './api'

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    ...response,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function runFixture() {
  return {
    scenarioId: 'smishing/cambio-numero',
    version: 1,
    outcome: 'CORRECTO' as const,
    score: 100,
    endingId: 'e_verifica',
    durationMs: 1000,
    startedAt: '2026-08-01T10:00:00.000Z',
    decisions: [],
  }
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('adjunta el token guardado en las peticiones autenticadas', async () => {
    setToken('t0ken')
    const fetchMock = mockFetch({ json: () => Promise.resolve({ id: 'p1' }) })

    await fetchMe()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t0ken')
  })

  it('no manda token en login', async () => {
    setToken('t0ken')
    const fetchMock = mockFetch({
      json: () => Promise.resolve({ accessToken: 'nuevo', participant: {} }),
    })

    await login('a@b.com', 'secreta12')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  // Sin descartarlo, la app queda en un bucle de 401 sin llegar al login.
  it('descarta el token cuando el servidor responde 401', async () => {
    setToken('vencido')
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Token inválido o expirado.' }),
    })

    await expect(fetchMe()).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBeNull()
  })

  it('conserva el token ante errores que no son 401', async () => {
    setToken('valido')
    mockFetch({ ok: false, status: 500, json: () => Promise.resolve(null) })

    await expect(fetchMe()).rejects.toMatchObject({ status: 500 })
    expect(getToken()).toBe('valido')
  })

  // Nest manda `message` como arreglo cuando falla la validación del DTO.
  it('usa el primer mensaje cuando el error trae un arreglo', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: ['El correo no tiene un formato válido.', 'otro'] }),
    })

    await expect(createRun(runFixture())).rejects.toThrow(
      'El correo no tiene un formato válido.',
    )
  })

  it('cae en un mensaje genérico cuando la respuesta no trae detalle', async () => {
    mockFetch({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('no es json')),
    })

    await expect(fetchMe()).rejects.toThrow('No se pudo conectar con el servidor.')
  })
})
