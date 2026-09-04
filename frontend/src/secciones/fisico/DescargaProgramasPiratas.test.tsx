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

  const RUTAS_DE_DESCARGA: [string, RegExp, string, string][] = [
    [
      'sitio pirata',
      /Adobe gratis 2024/,
      'Descargar ahora',
      'Caíste en la trampa - Resultado pirata',
    ],
    [
      'adobe.com oficial',
      /Adobe: Creative, marketing and document management solutions/,
      'Descargar ahora',
      'No caíste - Descargaste del sitio oficial',
    ],
    [
      'prueba gratuita de adobe.com',
      /Adobe: Creative, marketing and document management solutions/,
      'Probar gratis',
      'Decisión segura - Versión de prueba legal',
    ],
    [
      'sitio falso de Flash',
      /Adobe Flash gratis - Software libre/,
      'Descargar ahora',
      'Caíste en la trampa - Sitio falso',
    ],
  ]

  it.each(RUTAS_DE_DESCARGA)(
    'elegir %s y luego "%s" lleva al veredicto correcto',
    (_caso, resultado, boton, veredicto) => {
      const telefono = empezar(<DescargaProgramasPiratas />)

      fireEvent.click(within(telefono).getByText(resultado))
      fireEvent.click(within(telefono).getByText(boton))

      expect(screen.getByText(veredicto)).toBeDefined()
    },
  )
})
