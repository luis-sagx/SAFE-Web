import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BlocNotas from './BlocNotas'

describe('BlocNotas', () => {
  it('muestra el título de la ventana y el texto completo', () => {
    render(<BlocNotas texto="Hola, esto es una nota de prueba." />)
    expect(screen.getByText(/Bloc de notas/)).toBeDefined()
    expect(screen.getByText('Hola, esto es una nota de prueba.')).toBeDefined()
  })

  it('el texto es texto real del DOM, no HTML volcado con dangerouslySetInnerHTML', () => {
    const { container } = render(<BlocNotas texto="<b>no debería interpretarse</b>" />)
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByText('<b>no debería interpretarse</b>')).toBeDefined()
  })

  it('acepta un título propio', () => {
    render(<BlocNotas texto="contenido" titulo="Mensaje.txt — Bloc de notas" />)
    expect(screen.getByText('Mensaje.txt — Bloc de notas')).toBeDefined()
  })
})
