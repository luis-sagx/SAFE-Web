import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ModuleQuiz from './MiniTestModulo'

describe('ModuleQuiz', () => {
  it('muestra el título "Preguntas de refuerzo" y la primera de dos preguntas específicas del módulo', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    expect(screen.getByText('Preguntas de refuerzo')).toBeDefined()
    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
    expect(screen.getByText(/¿qué debes revisar para saber a qué sitio te lleva/)).toBeDefined()
  })

  it('cada módulo tiene sus propias preguntas, no las genéricas de otro', () => {
    render(<ModuleQuiz seccionId="fisico" onComplete={vi.fn()} />)

    expect(screen.getByText(/memoria USB que no reconoces/)).toBeDefined()
  })

  it('no deja avanzar sin elegir una opción primero', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    expect((screen.getByRole('button', { name: 'Siguiente pregunta' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('al elegir una opción y avanzar, pasa a la segunda pregunta sin mostrar si acertó o no', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    fireEvent.click(screen.getByText(/empiece con https/))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))

    expect(screen.getByText('Pregunta 2 de 2')).toBeDefined()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('al fallar una o las dos preguntas, muestra el resultado y un botón para repetir la prueba, sin llamar a onComplete', () => {
    const onComplete = vi.fn()
    render(<ModuleQuiz seccionId="phishing" onComplete={onComplete} />)

    fireEvent.click(screen.getByText(/empiece con https/)) // incorrecta
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))

    fireEvent.click(screen.getByText(/Abro la aplicación o el sitio oficial/)) // correcta
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar respuestas' }))

    expect(screen.getAllByTestId('feedback-incorrecto')).toHaveLength(1)
    expect(screen.getAllByTestId('feedback-correcto')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Repetir prueba' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('"Repetir prueba" reinicia el cuestionario desde la primera pregunta', () => {
    render(<ModuleQuiz seccionId="phishing" onComplete={vi.fn()} />)

    fireEvent.click(screen.getByText(/empiece con https/))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))
    fireEvent.click(screen.getByText(/Abro la aplicación o el sitio oficial/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar respuestas' }))

    fireEvent.click(screen.getByRole('button', { name: 'Repetir prueba' }))

    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
    expect((screen.getByRole('button', { name: 'Siguiente pregunta' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('al acertar las dos preguntas, muestra el resultado con un botón "Continuar" que llama a onComplete', () => {
    const onComplete = vi.fn()
    render(<ModuleQuiz seccionId="phishing" onComplete={onComplete} />)

    fireEvent.click(screen.getByText(/nombre del sitio después de https/))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente pregunta' }))
    fireEvent.click(screen.getByText(/Abro la aplicación o el sitio oficial/))
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar respuestas' }))

    expect(screen.getAllByTestId('feedback-correcto')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Repetir prueba' })).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('sin preguntas definidas para el módulo, no rompe: usa un set por defecto', () => {
    render(<ModuleQuiz seccionId="modulo-inexistente" onComplete={vi.fn()} />)

    expect(screen.getByText('Pregunta 1 de 2')).toBeDefined()
  })
})
