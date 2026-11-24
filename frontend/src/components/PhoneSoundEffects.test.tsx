import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { SoundProvider } from '../context/SoundContext'
import SubscriptionCancellation from '../secciones/smishing/BajaSuscripcion'
import GovernmentBenefit from '../secciones/smishing/BonoEstado'
import ForwardedCode from '../secciones/smishing/CodigoReenviado'
import HeldPackage from '../secciones/smishing/PaqueteRetenido'
import BlockedCard from '../secciones/smishing/TarjetaBloqueada'
import { start, terminarDeHablar } from '../test/escenario'

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())
vi.mock('../lib/api', async () => (await import('../test/escenario')).offlineApi())

const TAP = '/sonidos/tap-relleno-v1.wav'
const NOTIFICATION = '/sonidos/notificacion-v1.wav'

describe('Sonidos del teléfono simulado', () => {
  const played: string[] = []

  beforeEach(() => {
    played.length = 0
    vi.stubGlobal('Audio', class {
      constructor(private url: string) {}

      pause() {}

      play() {
        played.push(this.url)
        return Promise.resolve()
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.removeItem('sonido')
  })

  it('confirma el toque de relleno y evita repetir el efecto en pulsaciones seguidas', () => {
    const phone = within(start(<HeldPackage />))
    fireEvent.click(phone.getByRole('button', { name: /EnvíaExpress/ }))
    fireEvent.click(phone.getByText('Tienes 1 envío en curso.'))
    expect(played).toEqual([])

    fireEvent.click(phone.getByText('Puntos de retiro'))
    fireEvent.click(phone.getByText('Cotizar un envío'))
    expect(played).toEqual([TAP])
    expect(phone.getByText('Rastrear una guía')).toBeDefined()

    fireEvent.click(phone.getByText('Rastrear una guía'))
    expect(played.filter((url) => url === TAP)).toHaveLength(1)
  })

  it('deja en silencio una fila informativa', () => {
    const phone = within(start(<SubscriptionCancellation />))
    fireEvent.click(phone.getByRole('button', { name: /Mi Operadora/ }))
    fireEvent.click(phone.getByText('Recargas de saldo'))
    expect(played).toEqual([])
  })

  it('toca la notificación al empezar y no la repite al volver de otra app', () => {
    const { container } = render(<MemoryRouter><ForwardedCode /></MemoryRouter>)
    expect(played).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
    const phone = within(container.querySelector('#pantalla-escenario') as HTMLElement)
    expect(played).toEqual([NOTIFICATION])

    fireEvent.click(phone.getByRole('button', { name: /Banco/ }))
    fireEvent.click(phone.getByRole('button', { name: 'Salir de la aplicación' }))
    fireEvent.click(phone.getByRole('button', { name: 'Abrir la notificación' }))
    expect(played).toEqual([NOTIFICATION])
  })

  it('avisa cuando el SMS llega después de una decisión', () => {
    const phone = within(start(<GovernmentBenefit />))
    expect(played).toEqual([])

    fireEvent.click(phone.getByRole('link', { name: /bit\.ly/ }))
    expect(phone.getByRole('button', { name: 'Abrir la notificación' })).toBeDefined()
    expect(played).toEqual([NOTIFICATION])
  })

  it('muestra el SMS durante una llamada sin reproducir el aviso', () => {
    const container = start(<BlockedCard />)
    const phone = within(container)

    fireEvent.click(phone.getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(phone.getByRole('button', { name: 'Llamar a este número' }))
    terminarDeHablar(container)
    fireEvent.click(phone.getByRole('button', { name: /¿Qué consumo fue\?/ }))

    expect(phone.getByRole('button', { name: 'Abrir la notificación' })).toBeDefined()
    expect(played).not.toContain(NOTIFICATION)
  })

  it('respeta el silencio para las opciones de relleno', () => {
    localStorage.setItem('sonido', 'desactivado')
    const phone = within(start(<SoundProvider><HeldPackage /></SoundProvider>))
    fireEvent.click(phone.getByRole('button', { name: /EnvíaExpress/ }))
    fireEvent.click(phone.getByText('Puntos de retiro'))
    expect(played).toEqual([])
  })

  it('respeta el silencio al llegar un aviso', () => {
    localStorage.setItem('sonido', 'desactivado')
    const phone = within(start(<SoundProvider><ForwardedCode /></SoundProvider>))
    expect(phone.getByRole('button', { name: 'Abrir la notificación' })).toBeDefined()
    expect(played).toEqual([])
  })
})
