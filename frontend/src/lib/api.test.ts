import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  createRun,
  descargarCertificadoPdf,
  emitirCertificado,
  fetchAtestacion,
  fetchMe,
  getToken,
  login,
  setToken,
  verificarCertificado,
} from './api'

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

  it('renueva la sesión con la cookie del refresh y reintenta la petición original', async () => {
    setToken('vencido')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Token inválido o expirado.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'nuevo', participant: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'p1' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchMe()).resolves.toEqual({ id: 'p1' })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(getToken()).toBe('nuevo')

    // Sin body: el refresh token va en la cookie httpOnly que manda el propio
    // navegador, `credentials: 'same-origin'` es lo único que lo adjunta.
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(refreshUrl).toContain('/auth/refresh')
    expect(refreshInit.body).toBeUndefined()
    expect(refreshInit.credentials).toBe('same-origin')
  })

  it('descarta el access token si el refresh también falla', async () => {
    setToken('vencido')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchMe()).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBeNull()
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

describe('api · certificado', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('fetchAtestacion pide GET /runs/atestacion con el token', async () => {
    setToken('t0ken')
    const fetchMock = mockFetch({ json: () => Promise.resolve({ atestacion: 'un.jwt.firmado' }) })

    await expect(fetchAtestacion()).resolves.toEqual({ atestacion: 'un.jwt.firmado' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/runs/atestacion')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t0ken')
  })

  it('emitirCertificado manda la atestación en el cuerpo, no como query', async () => {
    setToken('t0ken')
    const fetchMock = mockFetch({
      json: () => Promise.resolve({ codigo: 'SW-AAAA-BBBB', emitidoAt: 'x', modulos: [], horas: 4 }),
    })

    await emitirCertificado('un.jwt.firmado')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/certificados')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ atestacion: 'un.jwt.firmado' })
  })

  it('verificarCertificado no manda el token de sesión: es una ruta pública', async () => {
    setToken('t0ken')
    const fetchMock = mockFetch({ json: () => Promise.resolve({ valido: true }) })

    await verificarCertificado('SW-AAAA-BBBB')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/certificados/verificar/SW-AAAA-BBBB')
    expect((init.headers as Record<string, string> | undefined)?.Authorization).toBeUndefined()
  })

  it('descargarCertificadoPdf devuelve el blob de la respuesta', async () => {
    setToken('t0ken')
    const pdf = new Blob(['%PDF-'])
    mockFetch({ blob: () => Promise.resolve(pdf) })

    const resultado = await descargarCertificadoPdf('un.jwt.firmado')

    expect(resultado).toBe(pdf)
  })

  // Mismo mecanismo que el resto del API: si el access token venció justo
  // entre pedir la atestación y descargar el PDF, se renueva una vez y se
  // reintenta, en vez de fallar la descarga por una expiración de segundos.
  it('descargarCertificadoPdf renueva la sesión y reintenta si el access token venció', async () => {
    setToken('vencido')
    const pdf = new Blob(['%PDF-'])

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'nuevo', participant: {} }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, blob: () => Promise.resolve(pdf) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(descargarCertificadoPdf('un.jwt.firmado')).resolves.toBe(pdf)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(getToken()).toBe('nuevo')
  })

  it('descargarCertificadoPdf sin sesión que renovar, descarta el token y lanza ApiError', async () => {
    setToken('vencido')
    mockFetch({ ok: false, status: 401 })

    await expect(descargarCertificadoPdf('un.jwt.firmado')).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBeNull()
  })
})
