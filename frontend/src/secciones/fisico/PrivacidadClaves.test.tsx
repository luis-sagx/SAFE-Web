import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PrivacidadClaves from './PrivacidadClaves'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('PrivacidadClaves', () => {
  it('abre con las tres pestañas sensibles abiertas', () => {
    const telefono = empezar(<PrivacidadClaves />)

    expect(within(telefono).getByText('Contraseñas')).toBeDefined()
    expect(within(telefono).getByText('Emails')).toBeDefined()
    expect(within(telefono).getByText('Documentos')).toBeDefined()
  })

  it('la pista explica cómo actuar sin revelar la respuesta', () => {
    empezar(<PrivacidadClaves />)

    fireEvent.click(screen.getByText(/No sé por dónde empezar/))

    expect(screen.getByText(/Luego bloquea la pantalla/)).toBeDefined()
  })

  it('cerrar las tres pestañas y terminar es la decisión segura', async () => {
    const telefono = empezar(<PrivacidadClaves />)

    within(telefono).getAllByText('×').forEach((boton) => fireEvent.click(boton))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Terminar' }))

    expect(await screen.findByText('Excelente. Privacidad protegida')).toBeDefined()
  })

  it('terminar sin cerrar las pestañas expone la información', async () => {
    const telefono = empezar(<PrivacidadClaves />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Terminar' }))

    expect(await screen.findByText('Información expuesta')).toBeDefined()
  })

  it('explica cuándo termina el escenario', () => {
    empezar(<PrivacidadClaves />)

    fireEvent.click(screen.getByText('¿Cuándo termina el escenario?'))

    expect(screen.getByText(/presiones "Terminar"/)).toBeDefined()
  })
})
