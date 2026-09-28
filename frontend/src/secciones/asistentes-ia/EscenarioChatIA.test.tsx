import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SchoolReport from './InformeEscolar'
import AIChatScenario from './EscenarioChatIA'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { Story } from '../../hooks/useStoryEngine'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

// Se prueba a través de un escenario real (InformeEscolar) y no con una
// historia sintética: es el propio wrapper compartido el que importa (issue
// #241), y los cuatro escenarios de asistentes-ia lo usan igual.
describe('AIChatScenario (marco común de asistentes-ia)', () => {
  it('explica el objetivo general del módulo antes de la instrucción propia del escenario', () => {
    start(<SchoolReport />)

    expect(
      screen.getByText(/La IA hará lo que le pidas/),
    ).toBeDefined()
    // La instrucción propia del escenario se conserva, no se reemplaza.
    expect(screen.getByText(/Copia el seguimiento que quieres mejorar/)).toBeDefined()
  })

  it('sin instrucción propia, usa el texto por defecto además del encuadre general', () => {
    const story: Story<ScreenNode> = {
      n1: {
        kind: 'scene',
        view: { kind: 'sms', sender: 'Alguien', sub: 'Chat de prueba', msgs: [] },
      },
    }

    start(
      <AIChatScenario
        escenarioId="asistentes-ia/correo-credenciales"
        resumen="Resumen de prueba."
        contexto={{ antes: 'Antes.', ahora: 'Ahora.' }}
        story={story}
        senales={[]}
        rule="Regla de prueba."
      />,
    )

    expect(screen.getByText(/La IA hará lo que le pidas/)).toBeDefined()
    expect(
      screen.getByText('Escribe tu mensaje y toca "Enviar", o elige una respuesta del chat.'),
    ).toBeDefined()
  })
})
