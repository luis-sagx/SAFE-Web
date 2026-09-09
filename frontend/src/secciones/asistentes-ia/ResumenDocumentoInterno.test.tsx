import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import ResumenDocumentoInterno from './ResumenDocumentoInterno'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('ResumenDocumentoInterno', () => {
  it('muestra el fragmento con las cifras y el plan de despidos', () => {
    const telefono = empezar(<ResumenDocumentoInterno />)
    expect(within(telefono).getByText(/\$340\.000/)).toBeDefined()
    expect(within(telefono).getByText(/15% del personal/)).toBeDefined()
  })

  it('pegar el fragmento completo filtra información confidencial', () => {
    empezar(<ResumenDocumentoInterno />)
    fireEvent.click(screen.getByRole('button', { name: /Pegar el fragmento completo/ }))
    expect(screen.getByText('Información confidencial de la empresa compartida con la IA')).toBeDefined()
  })

  it('pedir solo la estructura, sin las cifras, es el acierto', () => {
    empezar(<ResumenDocumentoInterno />)
    fireEvent.click(screen.getByRole('button', { name: /Pedir solo la estructura del resumen/ }))
    expect(screen.getByText('Resumen armado sin exponer datos de la empresa')).toBeDefined()
  })

  it('no usar la IA evita el riesgo pero queda como respuesta incompleta', () => {
    empezar(<ResumenDocumentoInterno />)
    fireEvent.click(screen.getByRole('button', { name: /No usar ninguna IA/ }))
    expect(screen.getByText('Evitaste el riesgo, pero no hacía falta')).toBeDefined()
  })
})
