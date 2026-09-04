import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Campo from './Campo'

describe('Campo', () => {
  it('renderiza el campo de entrada sin errores', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Campo id="test" label="Test Field" value="" onChange={onChange} />
    )
    expect(container).toBeDefined()
    expect(screen.getByLabelText('Test Field')).toBeDefined()
  })

  it('renderiza con valor inicial', () => {
    const onChange = vi.fn()
    const input = render(
      <Campo id="test" label="Test" value="initial" onChange={onChange} />
    ).getByDisplayValue('initial') as HTMLInputElement
    expect(input.value).toBe('initial')
  })

  it('llama onChange cuando el usuario escribe', () => {
    const onChange = vi.fn()
    render(<Campo id="test" label="Test" value="" onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('muestra el mensaje de error cuando está presente', () => {
    const onChange = vi.fn()
    render(
      <Campo
        id="test"
        label="Test"
        value=""
        onChange={onChange}
        error="Campo requerido"
      />
    )
    expect(screen.getByText('Campo requerido')).toBeDefined()
  })

  it('muestra la ayuda cuando está presente y no hay error', () => {
    const onChange = vi.fn()
    render(
      <Campo
        id="test"
        label="Test"
        value=""
        onChange={onChange}
        ayuda="Esta es una ayuda"
      />
    )
    expect(screen.getByText('Esta es una ayuda')).toBeDefined()
  })

  it('no muestra ayuda cuando hay error', () => {
    const onChange = vi.fn()
    render(
      <Campo
        id="test"
        label="Test"
        value=""
        onChange={onChange}
        ayuda="Esta es una ayuda"
        error="Hay error"
      />
    )
    expect(screen.queryByText('Esta es una ayuda')).toBeNull()
    expect(screen.getByText('Hay error')).toBeDefined()
  })

  it('acepta props adicionales como placeholder y type', () => {
    const onChange = vi.fn()
    const input = render(
      <Campo
        id="email"
        label="Email"
        value=""
        onChange={onChange}
        type="email"
        placeholder="tu@email.com"
      />
    ).getByPlaceholderText('tu@email.com') as HTMLInputElement
    expect(input.type).toBe('email')
  })
})
