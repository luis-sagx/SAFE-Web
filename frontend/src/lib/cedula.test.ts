import { describe, expect, it } from 'vitest'
import { isEcuadorianId, normalizeEcuadorianId } from './cedula'

describe('cedula', () => {
  describe('normalizeEcuadorianId', () => {
    it('removes dashes, dots, and spaces', () => {
      expect(normalizeEcuadorianId('17-100-340-65')).toBe('1710034065')
      expect(normalizeEcuadorianId('17.100.340.65')).toBe('1710034065')
      expect(normalizeEcuadorianId('17 100 340 65')).toBe('1710034065')
    })

    it('returns unchanged for digits only', () => {
      expect(normalizeEcuadorianId('1710034065')).toBe('1710034065')
    })

    it('handles empty string', () => {
      expect(normalizeEcuadorianId('')).toBe('')
    })
  })

  describe('isEcuadorianId', () => {
    it('validates valid ecuadorian IDs', () => {
      expect(isEcuadorianId('1710034065')).toBe(true)
    })

    it('rejects non-numeric', () => {
      expect(isEcuadorianId('17100340a5')).toBe(false)
    })

    it('rejects wrong length', () => {
      expect(isEcuadorianId('171003406')).toBe(false)
      expect(isEcuadorianId('17100340651')).toBe(false)
    })

    it('rejects invalid province codes', () => {
      expect(isEcuadorianId('0010034065')).toBe(false)
      expect(isEcuadorianId('2510034065')).toBe(false)
    })

    it('rejects third digit >= 6', () => {
      expect(isEcuadorianId('1760034065')).toBe(false)
      expect(isEcuadorianId('1770034065')).toBe(false)
    })

    it('rejects invalid checksum', () => {
      expect(isEcuadorianId('1710034064')).toBe(false)
      expect(isEcuadorianId('1710034066')).toBe(false)
    })

    it('accepts valid checksums after normalization', () => {
      expect(isEcuadorianId('17-100-340-65')).toBe(true)
      expect(isEcuadorianId('17.100.340.65')).toBe(true)
    })

    it('handles empty input', () => {
      expect(isEcuadorianId('')).toBe(false)
    })
  })
})
