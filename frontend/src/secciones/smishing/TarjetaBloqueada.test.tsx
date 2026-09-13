import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import BlockedCard from './TarjetaBloqueada'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('TarjetaBloqueada', () => {
  it('el campo no se escribe solo: la frase se elige entre las que ofrece el hilo', () => {
    const phone = start(<BlockedCard />)

    expect(within(phone).queryByRole('button', { name: 'Mensaje de texto' })).toBeNull()
    expect(within(phone).getByRole('button', { name: /¿Qué consumo fue\?/ })).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /¿Qué consumo fue\?/ }))
    expect(screen.getByText('No entregaste nada, pero contestaste')).toBeDefined()
  })

  // Tocar el número lo pone en el marcador, no en la llamada. Marcar tiene que
  // ser una decisión del participante: sin ese paso, tocar el número metía en
  // la conversación de golpe, como si hubiera llamado alguien más.
  it('tocar el número abre el marcador, no la llamada', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))

    expect(within(phone).getByLabelText('Marcador')).toBeDefined()
    expect(within(phone).getByRole('button', { name: 'Llamar a este número' })).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  // Salir del marcador es lo correcto y no es suficiente: la corrida sigue
  // abierta, porque el estado de la tarjeta sigue sin comprobarse.
  it('no llamar devuelve al hilo con el escenario todavía por resolver, y mirar las tarjetas cierra', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Salir del marcador sin llamar' }))

    expect(within(phone).getByText(/fue BLOQUEADA/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mis tarjetas/ }))

    // Sin llamada de por medio, mirar las tarjetas ya es la comprobación: no
    // queda nada abierto después, así que la corrida termina aquí.
    expect(within(phone).getByText('Activa · sin bloqueos ni intentos rechazados')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  it('llamar y colgar no entrega nada, pero ya marcaste', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Llamar a este número' }))

    expect(within(phone).getByLabelText('Llamada en curso')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('Colgaste bien, pero ya habías marcado')).toBeDefined()
  })

  it('dictar el código dentro de la llamada es el fallo', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Llamar a este número' }))
    fireEvent.click(within(phone).getByRole('button', { name: /¿Qué consumo fue\?/ }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Se lo dicto.' }))

    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('abrir la app del banco no termina la corrida, pero mirar las tarjetas sí', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))

    // Abrir deja en el inicio de la banca móvil, con su menú, y sin veredicto.
    expect(within(phone).getByText('Cupo disponible $1.240,00')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mis tarjetas/ }))

    expect(within(phone).getByText('Activa · sin bloqueos ni intentos rechazados')).toBeDefined()
    expect(screen.getByText('No caíste · lo comprobaste donde consta')).toBeDefined()
  })

  // La bifurcación del §3.3: con la llamada en pantalla, el icono del banco
  // abre la variante que no cierra nada, porque colgar sigue pendiente.
  it('comprobar la tarjeta en plena llamada no cierra el escenario: hay que colgar', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Llamar a este número' }))
    expect(within(phone).getByLabelText('Llamada en curso')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Mis tarjetas/ }))

    // Se ve el mismo estado de siempre, pero la corrida sigue abierta.
    expect(within(phone).getByText('Activa · sin bloqueos ni intentos rechazados')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    // El icono de Teléfono devuelve a la llamada exactamente donde se dejó.
    fireEvent.click(within(phone).getByRole('button', { name: /Teléfono/ }))
    expect(within(phone).getByLabelText('Llamada en curso')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Colgar la llamada' }))
    expect(screen.getByText('Colgaste bien, pero ya habías marcado')).toBeDefined()
  })

  it('anular la tarjeta sin mirar su estado no es el acierto', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('button', { name: /Banco/ }))
    fireEvent.click(within(phone).getByRole('button', { name: /Bloquear tarjeta/ }))

    expect(screen.getByText('Anulaste una tarjeta que estaba sana')).toBeDefined()
  })

  // El código es auténtico y llega solo, justo cuando lo mencionan en la
  // llamada: es la mitad del ataque que antes no se veía.
  it('el código llega como notificación al pedirlo, y el icono Teléfono devuelve a la llamada', () => {
    const phone = start(<BlockedCard />)

    fireEvent.click(within(phone).getByRole('link', { name: '09 87 654 321' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Llamar a este número' }))
    fireEvent.click(within(phone).getByRole('button', { name: /¿Qué consumo fue\?/ }))

    expect(within(phone).getByText('BANCO LITORAL')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Abrir la notificación' }))
    expect(within(phone).getByText(/Su codigo de autorizacion es 508 213/)).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Teléfono/ }))
    expect(within(phone).getByLabelText('Llamada en curso')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Se lo dicto.' }))
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })
})
