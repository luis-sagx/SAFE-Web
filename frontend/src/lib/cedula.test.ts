import { describe, expect, it } from 'vitest'
import { esCedulaEcuatoriana, normalizarCedula } from './cedula'

// Cédulas construidas con el algoritmo, no de personas reales.
describe('esCedulaEcuatoriana', () => {
  it.each(['1710034065', '0926687856', '1104535438', '3012345678'])('acepta %s', (cedula) => {
    expect(esCedulaEcuatoriana(cedula)).toBe(true)
  })

  // Cada una tiene el verificador CORRECTO: lo que se rechaza es la otra
  // regla, no un dígito mal puesto.
  it.each([
    ['dígito verificador incorrecto', '1710034066'],
    ['provincia 00', '0010034064'],
    ['provincia 25, que no existe', '2510034065'],
    ['provincia 31, fuera de rango', '3110034067'],
    ['tercer dígito 6: no es persona natural', '1760034064'],
    ['nueve dígitos', '171003406'],
    ['once dígitos', '17100340651'],
    ['con letras', '17100340a5'],
    ['vacía', ''],
  ])('rechaza %s', (_caso, cedula) => {
    expect(esCedulaEcuatoriana(cedula)).toBe(false)
  })

  // El backend normaliza igual; si el front no lo hiciera, el participante
  // vería un error mientras escribe algo que el servidor sí aceptaría.
  it('acepta la misma cédula escrita con guiones, puntos o espacios', () => {
    expect(esCedulaEcuatoriana('171003406-5')).toBe(true)
    expect(esCedulaEcuatoriana('1710 0340 65')).toBe(true)
    expect(normalizarCedula('171.003.406-5')).toBe('1710034065')
  })
})
