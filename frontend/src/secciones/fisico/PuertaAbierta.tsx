import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import DeviceScreen from '../../components/ui/DeviceScreen'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import PanelVeredicto from '../../components/ui/PanelVeredicto'
import StoryChoices from '../../components/ui/StoryChoices'
import Instrucciones from '../../components/ui/Instrucciones'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

interface ScreenNode extends StoryNode {
  view: ScreenView
}

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Oficina',
  url: 'seguridad',
  secure: true,
  brand: 'Puesto de seguridad',
  title: 'Puerta abierta',
  subtitle: 'Una puerta de acceso restringido quedó sin seguro',
  datos: [
    {
      etiqueta: 'Sala',
      valor: 'Sala de servidores y equipos de red',
      senal: 'peligro',
    },
    {
      etiqueta: 'Acceso',
      valor: 'Normalmente requiere pase de seguridad',
      senal: 'peligro',
    },
    {
      etiqueta: 'Contenido',
      valor: 'Hardware crítico, backups, servidores VPN',
      senal: 'peligro',
    },
    {
      etiqueta: 'Estado',
      valor: 'Puerta con cierre automático pero batiente abierta',
      senal: 'peligro',
    },
  ],
  aviso:
    'Pasando por el pasillo de la oficina, notas que la puerta de la sala de servidores está abierta. No tiene el cierre automático activado. Esta es un área restringida normalmente, pero alguien (probablemente el técnico de IT) la dejó sin seguro.',
  opciones: [
    {
      texto: 'Entrar rápido a ver qué hay, nadie te verá',
      goto: 'e_entra',
      label: 'Accedió sin autorización a área restringida',
    },
    {
      texto: 'Llevar a un compañero visitante a verla "quick tour"',
      goto: 'e_lleva',
      label: 'Permitió acceso no autorizado a un tercero',
    },
    {
      texto: 'Cerrar la puerta sin hacer nada más',
      goto: 'e_cierra',
      label: 'Protegió el acceso dejando el área segura',
    },
    {
      texto: 'Cerrar la puerta y reportar a Seguridad o IT',
      goto: 'e_reporta',
      label: 'Aseguró el área y reportó la exposición',
    },
  ],
  fields: [],
  button: '',
}

const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_entra: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Accediste sin autorización a un área restringida',
    outcome:
      'Entrar a la sala de servidores sin permiso es una violación de seguridad grave. Aunque la puerta estuviera abierta, el acceso a esa área está restringido. Podrías haber tocado equipos, visto contraseñas, o modificado configuraciones sin saberlo. Esto es suficiente para terminar tu empleo y potencialmente enfrentar cargos criminales.',
  },
  e_lleva: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Permitiste acceso no autorizado a un tercero',
    outcome:
      'Llevar a alguien a un área restringida sin autorización es aún peor que entrar tú solo. Acabas de exponer equipo crítico de la empresa a alguien que no tiene background check, consentimiento informado, o autorización. Si esa persona daña algo, roba información o causa un incidente, tú eres responsable.',
  },
  e_cierra: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'Protegiste el acceso pero no reportaste',
    outcome:
      'Cerrar la puerta fue correcto, pero dejar pasar el incidente es arriesgado. Alguien (probablemente IT) olvidó asegurar una área crítica. Ese olvido podría repetirse, o alguien malintencional podría haber notado lo mismo antes que tú. Reportar asegura que se investigue.',
  },
  e_reporta: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Actuaste correctamente cerrando y reportando',
    outcome:
      'Perfecto. Cerraste la puerta (acción defensiva inmediata) y reportaste a Seguridad o IT (protocolo). Ellos pueden investigar por qué la puerta se abrió, si alguien entró sin autorización, y asegurar el área. Es la respuesta correcta: defensiva + preventiva.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Un <b>área restringida sin seguro físico</b> es una exposición de infraestructura crítica. Cualquiera —empleado mal intencionado o visitante no autorizado— podría acceder, robar información o sabotear sistemas.',
  },
]

const RESUMEN = 'Viste la puerta de la sala de servidores abierta sin seguro.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde hay áreas restringidas que requieren pase de seguridad. La sala de servidores es una de ellas.',
  ahora: (
    <>
      <strong>Tarde, pasando por un pasillo.</strong> Ves que la puerta de la sala de servidores de la empresa está
      abierta. Es una puerta con cierre automático, pero normalmente hace falta un pase para entrar. Hoy está sin
      seguro —parece que el técnico de IT está trabajando ahí pero se fue sin aseguarla. Desde el pasillo puedes ver
      equipos de red, servidores, y backup drives.
    </>
  ),
}

function PuertaAbierta() {
  const engine = useStoryEngine(STORY, 'n1', 'fisico/puerta-abierta')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)

  const onHotspot = (event: React.MouseEvent) => {
    if (engine.isEnding) return

    const objetivo = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot-goto]')
    if (!objetivo) {
      if (!engine.node.choices) {
        setTocoEnVacio(true)
      }
      return
    }

    setTocoEnVacio(false)
    const goto = objetivo.dataset.hotspotGoto
    if (goto && goto !== engine.current) {
      engine.choose(goto, objetivo.dataset.hotspotLabel)
    }
  }

  const pantalla = (
    <div
      id="pantalla-escenario"
      onClick={onHotspot}
      style={{ width: '100%', height: '100%' }}
    >
      <DeviceScreen view={engine.node.view} />
    </div>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="fisico/puerta-abierta"
      node={engine.node}
      senales={SENALES}
      regla='Regla de oro: <b>si ves un área restringida abierta sin seguro, ciérrala e inmediatamente reporta a Seguridad</b>. No entres, no lleves a otros, no dejes que se exponga más tiempo.'
      restartLabel="↻ Repetir el escenario"
      onRestart={() => {
        engine.restart()
        setTocoEnVacio(false)
      }}
      contenedorId="pantalla-escenario"
    />
  ) : (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      {engine.node.choices ? (
        <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />
      ) : (
        <Instrucciones pista={
          <p>
            Cierra la puerta y reporta inmediatamente. No entres, no lleves a otros, no ignores el riesgo. Las áreas
            restringidas deben estar seguras siempre.
          </p>
        } fallo={tocoEnVacio}>
          <p className="text-lg leading-relaxed text-body">
            La puerta de un área restringida quedó abierta sin seguro. <strong>¿Qué haces?</strong> Elige tu acción.
          </p>
        </Instrucciones>
      )}
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/puerta-abierta"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={
        <p>
          Vas a ver una pantalla que simula una situación en tu oficina. Puedes actuar sobre ella como lo harías en
          la vida real.
        </p>
      }
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={() => {
        engine.restart()
        setTocoEnVacio(false)
      }}
      dispositivo="telefono"
    />
  )
}

export default PuertaAbierta
