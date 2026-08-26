import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Café Amanecer',
  url: 'wifi-publico',
  secure: false,
  brand: 'Red pública sin cifrar',
  title: 'WiFi del café',
  subtitle: 'Conexión desprotegida',
  datos: [
    {
      etiqueta: 'Nombre de red',
      valor: 'CafeAmanecer_Free (sin contraseña)',
      senal: 'peligro',
    },
    {
      etiqueta: 'Encriptación',
      valor: 'Ninguna — tráfico visible para cualquiera',
      senal: 'peligro',
    },
    {
      etiqueta: 'Usuarios conectados',
      valor: '23 dispositivos en la misma red',
      senal: 'peligro',
    },
  ],
  aviso:
    'Estás en un café esperando a un cliente. Necesitas terminar un informe con datos de proyectos y contraseñas antes de la reunión. El café ofrece WiFi público sin contraseña. Nadie se vería afectado si esperas, pero sería más cómodo terminar ahora.',
  opciones: [
    {
      texto: 'Conectarte y enviar el informe por email directamente',
      goto: 'e_envia',
      label: 'Transmitió datos confidenciales por red pública sin cifrar',
    },
    {
      texto: 'Conectarte y guardar el archivo en la nube del trabajo',
      goto: 'e_nube',
      label: 'Sincronizó datos con credenciales de empresa en red pública',
    },
    {
      texto: 'Usar el hotspot de tu celular con dato móvil',
      goto: 'e_celular',
      label: 'Usó conexión cifrada propia con datos de tu plan',
    },
    {
      texto: 'Esperar a la oficina o a una conexión segura',
      goto: 'e_espera',
      label: 'Retrasó la tarea pero evitó exponerse',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_envia: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Enviaste datos confidenciales por una red pública sin cifrar',
    outcome:
      'El email que acabas de enviar —con el informe y cualquier dato que contenga— viaja en texto plano a través del WiFi. Cualquiera en el café con una herramienta básica de red puede interceptar tu tráfico, leer el email, ver el informe y capturar cualquier contraseña o dato que hayas incluido.',
  },
  e_nube: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Sincronizaste datos con credenciales de empresa en red pública',
    outcome:
      'Cuando sincronizas con la nube de la empresa desde el WiFi público, tu sesión —incluyendo tu usuario y contraseña— viaja sin cifrar. Aunque el servidor de la nube puede tener https, el primer tramo es visible. Un atacante puede robar tus credenciales e infiltrarse en los sistemas de la empresa.',
  },
  e_celular: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Usaste tu conexión cifrada propia',
    outcome:
      'Correcto. Tu hotspot de celular usa cifrado (4G/5G) que el WiFi público no tiene. Tu tráfico viaja encriptado desde tu laptop a través de tu plan de datos. Es más lento, pero es seguro. Cuando tienes datos sensibles, el WiFi público nunca vale la pena.',
  },
  e_espera: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'Retrasaste pero evitaste el riesgo',
    outcome:
      'No es la opción ideal (esperar retrasa el trabajo), pero es la más segura. Cuando tienes datos sensibles y no hay conexión confiable disponible, esperar a una red cifrada es lo correcto. La seguridad de los datos pesa más que la comodidad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      '<b>WiFi público sin contraseña = sin encriptación</b>. Cualquiera en la red puede ver todo lo que transmites: emails, credenciales, datos, archivos. No es seguro para nada que contenga información de la empresa.',
  },
]

const RESUMEN = 'Conectaste a un WiFi público sin encriptación para completar trabajo con datos confidenciales.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas con información confidencial de la empresa y sabes que no debe exponerse en redes públicas.',
  ahora: (
    <>
      <strong>Pausa de reunión.</strong> Estás en un café esperando a un cliente. Necesitas enviar un informe con datos
      de proyectos y salarios antes de la reunión —son 10 minutos de trabajo. El café ofrece WiFi gratis ({'"'}CafeAmanecer_Free
      {'"'}, sin contraseña). Tu celular tiene datos móviles, pero de un plan limitado. ¿Qué haces?
    </>
  ),
}

function ConexionPublica() {
  const { displayName, roleLabel } = useAuth()
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
        <DossierHeader
          caseLabel="RIESGO FÍSICO"
          secondTab="INTRODUCCIÓN"
          riskLabel="RIESGO"
          gaugePercent={0}
          gaugeValueText=""
          gaugeColor="var(--color-primary)"
          participantName={displayName}
          participantRole={roleLabel}
        />

        <main className={styles.mainArea}>
          <p className={styles.introText}>
            Hola, {displayName}. Estás en un café esperando a un cliente. Necesitas enviar un informe con datos de
            proyectos antes de la reunión. El café ofrece WiFi público gratis, pero también tienes datos móviles.
          </p>

          <div className={styles.instructionsBox}>
            <p className={styles.instructionsTitle}>Contexto</p>
            <p className={styles.summary}>
              Las redes WiFi públicas sin contraseña no tienen encriptación. Eso significa que cualquiera conectado a
              la misma red puede ver todo lo que transmites: emails, credenciales, documentos, chats. Es especialmente
              peligroso si transmites datos de la empresa.
            </p>
            <p className={styles.summary}>
              Tu decisión sobre cómo conectarte determina si expones los datos de la empresa o si los proteges.
            </p>
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.snapBtn} onClick={() => setStarted(true)}>
              Comenzar escenario →
            </button>
          </div>
        </main>

        <Link to="/seccion/fisico" className={styles.backLink}>
          ← Volver a la sección
        </Link>
      </div>
    )
  }

  return (
    <StoryEscenario
      escenarioId="fisico/conexion-publica"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>nunca transmitas datos confidenciales por WiFi público</b>. Usa VPN si tienes que hacerlo, o espera a una red segura (4G/5G, oficina, home office).'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Necesitas completar un informe con datos de la empresa en un café con WiFi público. <strong>¿Cómo te conectas?</strong>
        </p>
      }
      pista={
        <p>
          Las redes públicas sin contraseña no tienen encriptación. Usa tu celular con datos móviles o espera a una
          conexión segura. Nunca es una buena idea usar WiFi público para datos confidenciales.
        </p>
      }
    />
  )
}

export default ConexionPublica
