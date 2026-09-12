import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import PiratedSoftwareDownload from './DescargaProgramasPiratas'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('DescargaProgramasPiratas', () => {
  it('abre en los resultados de búsqueda de Adobe', () => {
    const phone = start(<PiratedSoftwareDownload />)

    expect(within(phone).getAllByText(/Resultados para: descargar Adobe/).length).toBeGreaterThan(0)
  })

  it('explica cuándo termina el escenario', () => {
    start(<PiratedSoftwareDownload />)

    fireEvent.click(screen.getByText('¿Cuándo termina el escenario?'))

    expect(screen.getByText(/Volver a los resultados de búsqueda no cuenta/)).toBeDefined()
  })

  const DOWNLOAD_PATHS: [string, RegExp, string, string][] = [
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

  it.each(DOWNLOAD_PATHS)(
    'elegir %s y luego "%s" lleva al veredicto correcto',
    (_case, result, button, verdict) => {
      const phone = start(<PiratedSoftwareDownload />)

      fireEvent.click(within(phone).getByText(result))
      fireEvent.click(within(phone).getByText(button))

      expect(screen.getByText(verdict)).toBeDefined()
    },
  )
})
