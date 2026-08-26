import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import AppHeader from '../../components/AppHeader'
import InfoLink from '../../components/InfoLink'
import ContextoEscenario from '../../components/ui/ContextoEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import { getSeccion } from '../../data/catalogo'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Oficina',
  url: 'seguridad',
  secure: true,
  brand: 'Puesto de seguridad',
  title: 'Carnet olvidado',
  subtitle: 'Encontraste un carnet en el piso',
  datos: [
    {
      etiqueta: 'Nombre',
      valor: 'Sergio Martín López',
      senal: 'peligro',
    },
    {
      etiqueta: 'Código de empleado',
      valor: 'ID-287451 | Área: Operaciones',
      senal: 'peligro',
    },
    {
      etiqueta: 'Nivel de acceso',
      valor: 'Nivel 3 (Acceso a áreas restringidas)',
      senal: 'peligro',
    },
  ],
  aviso:
    'Encontraste un carnet de identificación en el piso del vestíbulo. Tiene toda la información de un empleado: nombre, número de empleado, foto y nivel de acceso.',
  opciones: [
    {
      texto: 'Publicar en el chat de la empresa: "¿De quién es este carnet?"',
      goto: 'e_expone',
      label: 'Expuso públicamente los datos de un empleado',
    },
    {
      texto: 'Guardarlo en tu escritorio "por si acaso"',
      goto: 'e_guarda',
      label: 'Guardó un documento de identificación sin autorización',
    },
    {
      texto: 'Entregarlo al área de Seguridad o Recursos Humanos',
      goto: 'e_entrega',
      label: 'Reportó el documento perdido a las autoridades correctas',
    },
    {
      texto: 'Dejarlo donde lo encontraste para que el dueño lo vea',
      goto: 'e_deja',
      label: 'Dejó un documento de identificación en lugar visible',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_expone: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Expusiste públicamente los datos personales de un empleado',
    outcome:
      'Publicar los datos de un empleado en el chat de la empresa es una violación grave de privacidad. Acabas de exponer su nombre, código de empleado y nivel de acceso a toda la organización. Alguien malintencionado podría usar esa información para phishing o suplantación.',
  },
  e_guarda: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Guardaste un documento de identificación sin autorización',
    outcome:
      'Un carnet de empleado es un documento de identidad y acceso. Guardarlo en tu escritorio significa que podrías usarlo para impersonar a esa persona o acceder a áreas que no te corresponden. Es ilegal y constituye un robo de identidad parcial.',
  },
  e_entrega: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Actuaste correctamente entregando el documento',
    outcome:
      'Correcto. Entregar un carnet perdido al área de Seguridad o Recursos Humanos es lo apropiado. Ellos se encargarán de identificar al dueño de forma segura y hacer que se reemita si es necesario. Es la forma segura de manejar un documento de acceso.',
  },
  e_deja: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'No actuaste, dejaste el riesgo expuesto',
    outcome:
      'Dejar el carnet en el lugar donde lo encontraste es mejor que guardarlo o publicarlo, pero igualmente riesgoso. Cualquiera que pase podría encontrarlo y usarlo para acceder a áreas restringidas o usarlo en una suplantación. El carnet sigue siendo un riesgo de seguridad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Un <b>carnet de identificación perdido</b> es un documento de acceso que puede ser usado por otros para impersonación o acceso no autorizado a áreas restringidas.',
  },
]

const RESUMEN = 'Encontraste un carnet de identificación de un empleado en el piso.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en una oficina donde los carnets son documentos de control de acceso físico a áreas restringidas.',
  ahora: (
    <>
      <strong>Mañana temprano.</strong> Mientras llegas a la oficina por la entrada del vestíbulo, ves un carnet tirado
      en el piso. Lo levantas y ves que tiene toda la información: nombre del empleado, su código de empleado, su
      foto, y su nivel de acceso.
    </>
  ),
}

function CarnetOlvidado() {
  const { displayName } = useAuth()
  const [started, setStarted] = useState(false)

  if (!started) {
    const seccion = getSeccion('fisico')
    const volver = (
      <Link to="/seccion/fisico" className="text-base font-medium text-link underline">
        ← Volver a la sección
      </Link>
    )

    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader>
          {volver}
          <InfoLink />
        </AppHeader>

        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-base font-medium text-muted">{seccion?.canal}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">Carnet olvidado</h1>

          <div className="mt-8">
            <p className="text-lg leading-relaxed text-ink">
              Hola, <strong className="font-semibold">{displayName}</strong>. Esto es lo que te está
              pasando:
            </p>

            <div className="mt-5">
              <ContextoEscenario contexto={CONTEXTO} />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="min-h-12 rounded-md bg-primary px-7 py-3.5 text-lg font-medium text-on-primary transition hover:bg-primary-active"
              >
                Comenzar escenario
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <StoryEscenario
      escenarioId="fisico/carnet-olvidado"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>documentos de acceso perdidos no se publican, no se guardan, se entregan inmediatamente a Seguridad</b>. Son herramientas de acceso, no objetos personales.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Encontraste un carnet con datos de un empleado. <strong>¿Qué haces?</strong> Elige la opción que consideres
          más segura.
        </p>
      }
      pista={
        <p>
          Los documentos de acceso deben entregarse directamente a Seguridad o Recursos Humanos. No los publiques, no
          los guardes, no los dejes expuestos.
        </p>
      }
    />
  )
}

export default CarnetOlvidado
