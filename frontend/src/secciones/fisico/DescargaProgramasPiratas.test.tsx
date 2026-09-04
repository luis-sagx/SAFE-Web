import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import DescargaProgramasPiratas from './DescargaProgramasPiratas'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('DescargaProgramasPiratas', () => {
  it('abre en los resultados de búsqueda de Adobe', () => {
    const telefono = empezar(<DescargaProgramasPiratas />)

    expect(within(telefono).getAllByText(/Resultados para: descargar Adobe/).length).toBeGreaterThan(0)
  })

  it('descargar desde el sitio pirata termina en malware', () => {
    const telefono = empezar(<DescargaProgramasPiratas />)

    fireEvent.click(within(telefono).getByText(/Adobe gratis 2024/))
    fireEvent.click(within(telefono).getByText('Descargar ahora'))

    expect(screen.getByText('Caíste en la trampa - Resultado pirata')).toBeDefined()
  })

  it('descargar desde adobe.com oficial es la decisión segura', () => {
    const telefono = empezar(<DescargaProgramasPiratas />)

    fireEvent.click(within(telefono).getByText('Adobe: Creative, marketing and document management solutions'))
    fireEvent.click(within(telefono).getByText('Descargar ahora'))

    expect(screen.getByText('No caíste - Descargaste del sitio oficial')).toBeDefined()
  })

  it('probar gratis desde adobe.com también es una decisión segura', () => {
    const telefono = empezar(<DescargaProgramasPiratas />)

    fireEvent.click(within(telefono).getByText('Adobe: Creative, marketing and document management solutions'))
    fireEvent.click(within(telefono).getByText('Probar gratis'))

    expect(screen.getByText('Decisión segura - Versión de prueba legal')).toBeDefined()
  })

  it('el resultado falso de Flash también compromete el equipo', () => {
    const telefono = empezar(<DescargaProgramasPiratas />)

    fireEvent.click(within(telefono).getByText('Adobe Flash gratis - Software libre'))
    fireEvent.click(within(telefono).getByText('Descargar ahora'))

    expect(screen.getByText('Caíste en la trampa - Sitio falso')).toBeDefined()
  })
})
