import { describe, expect, it } from 'vitest'
import { evaluateDatum, evaluateData, worstLevel, splitKnownData, mentionsAny, type SensitiveDatum } from './chatIA'

const CEDULA: SensitiveDatum = { id: 'cedula', tipo: 'numero', etiqueta: 'Cédula', valor: '1799999980' }
const NOMBRE: SensitiveDatum = {
  id: 'nombre',
  tipo: 'nombre',
  etiqueta: 'Nombre',
  nombre: 'Paola',
  apellido: 'Guamán',
}
const CORREO: SensitiveDatum = { id: 'correo', tipo: 'texto', etiqueta: 'Correo', valor: 'paola.guaman@safeweb.com' }

describe('evaluateDatum, números (cédula, cuenta, teléfono)', () => {
  it('el número real completo es fuga, aunque venga con espacios o guiones', () => {
    expect(evaluateDatum('mi cédula es 1799999980', CEDULA).nivel).toBe('fuga')
    expect(evaluateDatum('mi cédula es 179-999-9980', CEDULA).nivel).toBe('fuga')
    expect(evaluateDatum('mi cédula es 1 7 9 9 9 9 9 9 8 0', CEDULA).nivel).toBe('fuga')
  })

  // El caso que el issue pide resolver a propósito: un número inventado que
  // solo tiene la FORMA de una cédula (10 dígitos) nunca debe marcarse como
  // fuga, un detector por regex de "10 dígitos" sí caería en esto.
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

describe('evaluateDatum, nombre completo', () => {
  it('un nombre de hasta dos partes es seguro', () => {
    expect(evaluateDatum('soy Paola Guamán', NOMBRE).nivel).toBe('seguro')
    expect(evaluateDatum('SOY PAOLA GUAMAN', NOMBRE).nivel).toBe('seguro') // sin tilde y en mayúsculas
  })

  it('tres o más partes reales del nombre son fuga', () => {
    const NOMBRE_COMPUESTO: SensitiveDatum = {
      id: 'nombre-compuesto',
      tipo: 'nombre',
      etiqueta: 'Nombre completo',
      nombre: 'Andrea Carolina',
      apellido: 'Cedeño Mora',
    }
    expect(evaluateDatum('soy Andrea Carolina Cedeño', NOMBRE_COMPUESTO).nivel).toBe('fuga')
    expect(evaluateDatum('Andrea Carolina Cedeño Mora', NOMBRE_COMPUESTO).nivel).toBe('fuga')
  })

  it('una o dos partes del nombre son seguras', () => {
    const NOMBRE_COMPUESTO: SensitiveDatum = {
      id: 'nombre-compuesto',
      tipo: 'nombre',
      etiqueta: 'Nombre completo',
      nombre: 'Andrea Carolina',
      apellido: 'Cedeño Mora',
    }
    expect(evaluateDatum('soy Andrea', NOMBRE_COMPUESTO).nivel).toBe('seguro')
    expect(evaluateDatum('soy Andrea Cedeño', NOMBRE_COMPUESTO).nivel).toBe('seguro')
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

describe('evaluateDatum, texto (correo, cifras institucionales, fechas)', () => {
  it('el correo real exacto es fuga', () => {
    expect(evaluateDatum('mi correo es paola.guaman@safeweb.com', CORREO).nivel).toBe('fuga')
    expect(evaluateDatum('Mi Correo Es PAOLA.GUAMAN@SAFEWEB.COM', CORREO).nivel).toBe('fuga')
  })

  it('un correo distinto no es fuga', () => {
    expect(evaluateDatum('mi correo es paola@ejemplo.com', CORREO).nivel).toBe('seguro')
  })
})

describe('splitKnownData', () => {
  it('sin ningún dato real presente, devuelve el texto entero como un solo tramo plano', () => {
    const segmentos = splitKnownData('ayúdame a redactar un correo formal', [CEDULA, CORREO])
    expect(segmentos).toEqual([{ texto: 'ayúdame a redactar un correo formal' }])
  })

  it('marca el dato real cuando aparece tal cual, y deja el resto como tramos planos', () => {
    const segmentos = splitKnownData('mi cédula es 1799999980, gracias', [CEDULA])
    expect(segmentos).toEqual([
      { texto: 'mi cédula es ' },
      { texto: '1799999980', sensible: { id: 'cedula', etiqueta: 'Cédula' } },
      { texto: ', gracias' },
    ])
  })

  it('un dato inventado con la misma forma no se marca (no es el valor real)', () => {
    const segmentos = splitKnownData('mi cédula es 1234567890', [CEDULA])
    expect(segmentos).toEqual([{ texto: 'mi cédula es 1234567890' }])
  })

  it('marca varios datos reales presentes, en el orden en que aparecen', () => {
    const segmentos = splitKnownData('Soy Paola Guamán, mi correo es paola.guaman@safeweb.com', [
      CORREO,
      NOMBRE,
    ])
    expect(segmentos).toEqual([
      { texto: 'Soy ' },
      { texto: 'Paola Guamán', sensible: { id: 'nombre', etiqueta: 'Nombre' } },
      { texto: ', mi correo es ' },
      { texto: 'paola.guaman@safeweb.com', sensible: { id: 'correo', etiqueta: 'Correo' } },
    ])
  })
})

describe('worstLevel', () => {
  it('un solo dato en fuga hace que el resultado general sea fuga', () => {
    const resultados = evaluateData('soy Paola Guamán, mi cédula es 1799999980', [NOMBRE, CEDULA])
    expect(worstLevel(resultados)).toBe('fuga')
  })

  it('sin ninguna fuga pero con un parcial, el resultado general es parcial', () => {
    const resultados = evaluateData('soy Paola, los últimos dígitos de la cédula son 9980', [NOMBRE, CEDULA])
    expect(worstLevel(resultados)).toBe('parcial')
  })

  it('sin fuga ni parcial, el resultado general es seguro', () => {
    const resultados = evaluateData('ayúdame a redactar un correo formal', [NOMBRE, CEDULA, CORREO])
    expect(worstLevel(resultados)).toBe('seguro')
  })
})

describe('mentionsAny', () => {
  it('calza raíces al comienzo de palabra, sin importar tildes ni mayúsculas', () => {
    expect(mentionsAny('Mejoró la PARTICIPACIÓN', ['particip'])).toBe(true)
    expect(mentionsAny('nose', ['particip', 'tarea'])).toBe(false)
  })

  it('no calza la raíz en medio de otra palabra', () => {
    expect(mentionsAny('anticipación', ['cipac'])).toBe(false)
  })
})

describe('evaluateDatum, números por tramo', () => {
  it('no arma el número juntando cifras sueltas del mensaje', () => {
    expect(evaluateDatum('aula 99, grupo 80', CEDULA).nivel).toBe('seguro')
  })

  it('un celular con prefijo de país sigue siendo el número real', () => {
    const TELEFONO: SensitiveDatum = { id: 't', tipo: 'numero', etiqueta: 'Teléfono', valor: '099 000 0072' }
    expect(evaluateDatum('+593 99 000 0072', TELEFONO).nivel).toBe('fuga')
  })
})
