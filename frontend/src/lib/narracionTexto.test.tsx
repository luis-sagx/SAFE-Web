import { describe, expect, it } from 'vitest'
import { textoNarracion } from './narracionTexto'
import type { Context } from '../components/ui/ContextoEscenario'

describe('textoNarracion', () => {
  it('une antes, ahora y la frase de misión en un solo texto', () => {
    const contexto: Context = {
      antes: 'No juegas a la lotería.',
      ahora: 'Te llega un correo diciendo que ganaste un premio.',
    }

    expect(textoNarracion(contexto)).toBe(
      'No juegas a la lotería. Te llega un correo diciendo que ganaste un premio. Tu misión: decide qué haces con esto y por qué.',
    )
  })

  it('extrae texto plano de nodos JSX en antes y ahora', () => {
    const contexto: Context = {
      antes: 'No juegas a la lotería.',
      ahora: (
        <>
          <strong>Temprano</strong>, revisando el correo, aparece uno que dice que ganaste{' '}
          <strong>casi cincuenta mil dólares</strong>.
        </>
      ),
    }

    expect(textoNarracion(contexto)).toBe(
      'No juegas a la lotería. Temprano, revisando el correo, aparece uno que dice que ganaste casi cincuenta mil dólares. Tu misión: decide qué haces con esto y por qué.',
    )
  })
})
