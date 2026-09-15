import { describe, expect, it } from 'vitest'
import { evaluateDatum, evaluateData, worstLevel, type SensitiveDatum } from './chatIA'

const CEDULA: SensitiveDatum = { id: 'cedula', tipo: 'numero', etiqueta: 'Cédula', valor: '1799999980' }
const NOMBRE: SensitiveDatum = {
  id: 'nombre',
  tipo: 'nombre',
  etiqueta: 'Nombre',
  nombre: 'Paola',
  apellido: 'Guamán',
}
const CORREO: SensitiveDatum = { id: 'correo', tipo: 'texto', etiqueta: 'Correo', valor: 'paola.guaman@safeweb.com' }

describe('evaluateDatum — números (cédula, cuenta, teléfono)', () => {
  it('el número real completo es fuga, aunque venga con espacios o guiones', () => {
    expect(evaluateDatum('mi cédula es 1799999980', CEDULA).nivel).toBe('fuga')
    expect(evaluateDatum('mi cédula es 179-999-9980', CEDULA).nivel).toBe('fuga')
    expect(evaluateDatum('mi cédula es 1 7 9 9 9 9 9 9 8 0', CEDULA).nivel).toBe('fuga')
  })

  // El caso que el issue pide resolver a propósito: un número inventado que
  // solo tiene la FORMA de una cédula (10 dígitos) nunca debe marcarse como
  // fuga — un detector por regex de "10 dígitos" sí caería en esto.
  it('un número inventado con la misma forma (10 dígitos) no es fuga', () => {
    expect(evaluateDatum('mi cédula es 1234567890', CEDULA).nivel).toBe('seguro')
    expect(evaluateDatum('uso 0000000000 como ejemplo', CEDULA).nivel).toBe('seguro')
  })

  it('solo los últimos 4 dígitos reales sueltos es parcial, no fuga completa', () => {
    expect(evaluateDatum('los últimos dígitos son 9980', CEDULA).nivel).toBe('parcial')
  })

  it('ningún fragmento del número real es seguro', () => {
    expect(evaluateDatum('ayúdame a redactar un correo', CEDULA).nivel).toBe('seguro')
  })
})

describe('evaluateDatum — nombre completo', () => {
  it('nombre y apellido reales juntos es fuga', () => {
    expect(evaluateDatum('soy Paola Guamán', NOMBRE).nivel).toBe('fuga')
    expect(evaluateDatum('SOY PAOLA GUAMAN', NOMBRE).nivel).toBe('fuga') // sin tilde y en mayúsculas
  })

  it('solo el nombre de pila, o solo el apellido, es parcial', () => {
    expect(evaluateDatum('soy Paola', NOMBRE).nivel).toBe('parcial')
    expect(evaluateDatum('la solicitante es la señora Guamán', NOMBRE).nivel).toBe('parcial')
  })

  // El otro caso que el issue pide resolver: un apodo no es el nombre real,
  // así que no debe marcarse ni como fuga ni como parcial.
  it('un apodo no es el nombre real: no cuenta ni como fuga ni como parcial', () => {
    expect(evaluateDatum('soy Pao', NOMBRE).nivel).toBe('seguro')
  })

  it('que el apellido real sea sustring de otra palabra no cuenta (coincide por palabra completa)', () => {
    // "Guamaní" contiene "Guaman" como substring, pero no es la misma palabra.
    expect(evaluateDatum('trabajo con el señor Guamaní', NOMBRE).nivel).toBe('seguro')
  })
})

describe('evaluateDatum — texto (correo, cifras institucionales, fechas)', () => {
  it('el correo real exacto es fuga', () => {
    expect(evaluateDatum('mi correo es paola.guaman@safeweb.com', CORREO).nivel).toBe('fuga')
    expect(evaluateDatum('Mi Correo Es PAOLA.GUAMAN@SAFEWEB.COM', CORREO).nivel).toBe('fuga')
  })

  it('un correo distinto no es fuga', () => {
    expect(evaluateDatum('mi correo es paola@ejemplo.com', CORREO).nivel).toBe('seguro')
  })
})

describe('worstLevel', () => {
  it('un solo dato en fuga hace que el resultado general sea fuga', () => {
    const resultados = evaluateData('soy Paola Guamán, mi cédula es 1234567890', [NOMBRE, CEDULA])
    expect(worstLevel(resultados)).toBe('fuga')
  })

  it('sin ninguna fuga pero con un parcial, el resultado general es parcial', () => {
    const resultados = evaluateData('soy Paola, mi cédula es 1234567890', [NOMBRE, CEDULA])
    expect(worstLevel(resultados)).toBe('parcial')
  })

  it('sin fuga ni parcial, el resultado general es seguro', () => {
    const resultados = evaluateData('ayúdame a redactar un correo formal', [NOMBRE, CEDULA, CORREO])
    expect(worstLevel(resultados)).toBe('seguro')
  })
})
