import { describe, expect, it } from 'vitest'
import { textoPlano } from './textoPlano'

describe('textoPlano', () => {
  it('devuelve un string tal cual', () => {
    expect(textoPlano('No juegas a la lotería.')).toBe('No juegas a la lotería.')
  })

  it('extrae el texto de un fragmento con etiquetas mezcladas, sin perder espacios', () => {
    const nodo = (
      <>
        <strong>Temprano</strong>, revisando el correo, aparece uno que dice que ganaste{' '}
        <strong>casi cincuenta mil dólares</strong> en un sorteo.
      </>
    )
    expect(textoPlano(nodo)).toBe(
      'Temprano, revisando el correo, aparece uno que dice que ganaste casi cincuenta mil dólares en un sorteo.',
    )
  })

  it('ignora null, undefined y booleanos', () => {
    expect(textoPlano(null)).toBe('')
    expect(textoPlano(undefined)).toBe('')
    expect(textoPlano(false)).toBe('')
  })

  it('colapsa saltos de línea e indentación de JSX multilínea en un solo espacio', () => {
    const nodo = (
      <>
        Primera línea
        con indentación,
        segunda línea.
      </>
    )
    expect(textoPlano(nodo)).toBe('Primera línea con indentación, segunda línea.')
  })
})
