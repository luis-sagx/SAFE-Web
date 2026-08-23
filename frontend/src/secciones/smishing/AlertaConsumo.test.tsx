import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import AlertaConsumo from './AlertaConsumo'

// Las fábricas se importan dentro y no arriba: vitest eleva los `vi.mock` por
// encima de los imports del archivo, así que un símbolo importado todavía no
// existe cuando se registran.
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('AlertaConsumo', () => {
  // Las dos frases piden algo a un número que no lee, y cada una falla
  // distinto: una escribe la tarjeta entera, la otra deja al participante
  // esperando una llamada del banco que nunca va a llegar.
  it('pedir el bloqueo con el número de la tarjeta es el fallo', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Bloquéenme la tarjeta/ }))

    // Ya no es una burbuja para elegir: es un mensaje mandado, con el número.
    expect(within(telefono).queryByRole('button', { name: /Bloquéenme la tarjeta/ })).toBeNull()
    expect(within(telefono).getByText(/4539 0011 8842 4417/)).toBeDefined()
    expect(screen.getByText('Aviso legítimo, reacción peligrosa')).toBeDefined()
  })

  it.skip('pedir que te llamen no entrega nada, pero te deja esperando una llamada', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Llámenme por favor/ }))

    expect(screen.getByText('Pediste una llamada que el banco nunca hará')).toBeDefined()
  })

  it('salir del hilo cuenta como dejarlo pasar sin verificar', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver a la lista de mensajes' }))
    expect(screen.getByText('Prudente, pero incompleto')).toBeDefined()
  })

  it('las apps que no deciden se abren igual y se vuelve con la flecha', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Cámara/ }))

    expect(within(telefono).getByText(/La cámara está lista/)).toBeDefined()
    // Mirar no decide: la corrida sigue en curso y no entró en la traza.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(within(telefono).queryByText(/SUPERMERCADO LA UNIÓN/)).toBeNull()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver al hilo de mensajes' }))
    expect(within(telefono).getByText(/SUPERMERCADO LA UNIÓN/)).toBeDefined()
  })

  it('releer el hilo desde la app del banco no termina la corrida', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Mensajes/ }))

    expect(within(telefono).getByText(/SUPERMERCADO LA UNIÓN/)).toBeDefined()
    // La flecha de la cabecera vale "salgo del hilo y sigo con mi día". Vista
    // desde dentro de la app no puede significar eso, así que no responde.
    expect(
      within(telefono).queryByRole('button', { name: 'Volver a la lista de mensajes' }),
    ).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
  })

  it('verificar es usar la app, no abrirla', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))

    // Abrir deja en el inicio de la banca móvil, sin veredicto todavía, y sin
    // barra de direcciones porque no se llegó por un enlace.
    expect(within(telefono).getByText('Tarjeta *4417')).toBeDefined()
    expect(within(telefono).queryByText('bancolitoral.ec')).toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Movimientos/ }))

    // El consumo se ve en pantalla y la corrida sigue abierta: revisar es
    // mirar, y la decisión vuelve al mensaje (#74).
    expect(within(telefono).getByText('Últimos consumos')).toBeDefined()
    expect(within(telefono).getByText('$42,90')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Salir de la aplicación' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Volver a la lista de mensajes/ }))

    expect(screen.getByText('Acertaste · el aviso era legítimo')).toBeDefined()
  })

  it('bloquear la tarjeta sin mirar los movimientos no es el acierto', () => {
    const telefono = empezar(<AlertaConsumo />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Banco del Litoral/ }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Bloquear tarjeta/ }))

    expect(screen.getByText('Reaccionaste sin comprobar')).toBeDefined()
  })
})
