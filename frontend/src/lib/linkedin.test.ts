import { describe, expect, it } from 'vitest'
import { buildLinkedInAddToProfileUrl } from './linkedin'
import type { Certificate } from './api'

describe('buildLinkedInAddToProfileUrl', () => {
  const certificate: Certificate = {
    codigo: 'SW-AB12-CD34',
    emitidoAt: '2026-03-15T10:00:00.000Z',
    modulos: ['phishing', 'smishing'],
    horas: 8,
    calificacion: 100,
  }

  it('apunta al endpoint oficial de LinkedIn para agregar una certificación', () => {
    const url = new URL(buildLinkedInAddToProfileUrl(certificate, 'https://safe-web.site'))
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add')
  })

  it('enlaza certUrl y certId al código público de verificación, usando el origen recibido', () => {
    const url = new URL(buildLinkedInAddToProfileUrl(certificate, 'https://safe-web.site'))
    expect(url.searchParams.get('certUrl')).toBe('https://safe-web.site/verificar/SW-AB12-CD34')
    expect(url.searchParams.get('certId')).toBe('SW-AB12-CD34')
  })

  it('convierte emitidoAt a issueYear/issueMonth en base 1 (no el mes 0-indexado de Date)', () => {
    const url = new URL(buildLinkedInAddToProfileUrl(certificate, 'https://safe-web.site'))
    expect(url.searchParams.get('issueYear')).toBe('2026')
    expect(url.searchParams.get('issueMonth')).toBe('3')
  })

  it('no incluye organizationId todavía (sin página de empresa de LinkedIn creada)', () => {
    const url = new URL(buildLinkedInAddToProfileUrl(certificate, 'https://safe-web.site'))
    expect(url.searchParams.has('organizationId')).toBe(false)
  })
})
