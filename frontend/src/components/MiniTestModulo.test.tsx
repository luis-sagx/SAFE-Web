import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ModuleQuiz from './MiniTestModulo'

describe('ModuleQuiz', () => {
  it('muestra el título "Preguntas de refuerzo" y la primera de dos preguntas específicas del módulo', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    expect(screen.getByText('Preguntas de refuerzo')).toBeDefined()
    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
    expect(screen.getByText(/dirección web sospechosa/)).toBeDefined()
  })

  it('cada módulo tiene sus propias preguntas, no las genéricas de otro', () => {
    render(<ModuleQuiz seccionId="fisico" onComplete={vi.fn()} />)

    expect(screen.getByText(/memoria USB desconocida/)).toBeDefined()
  })

  it('al elegir la opción incorrecta, avisa y deja reintentar sin avanzar', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    fireEvent.click(screen.getByText(/empiece con https/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))

    expect(screen.getByText(/No es esa/)).toBeDefined()
    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
  })

  it('al acertar las dos preguntas, llama a onComplete', () => {
    const onComplete = vi.fn()
    render(<ModuleQuiz seccionId="phishing" onComplete={onComplete} />)

    fireEvent.click(screen.getByText(/justo antes de la primera barra/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.getByText(/Correcto/)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))
    expect(screen.getByText('Pregunta 2 de 2')).toBeDefined()
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText(/Entro directo por mi app o el sitio oficial/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(screen.getByText(/Correcto/)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('no deja comprobar sin elegir una opción primero', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    expect((screen.getByRole('button', { name: 'Comprobar' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('sin preguntas definidas para el módulo, no rompe: usa un set por defecto', () => {
    render(<ModuleQuiz seccionId="modulo-inexistente" onComplete={vi.fn()} />)

    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
  })
})
