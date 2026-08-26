import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import StoryEscenario, { type ScreenNode } from '../../components/StoryEscenario'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import type { ScreenView } from '../../components/ui/DeviceScreen'
import type { Senal } from '../../components/ui/PanelVeredicto'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

const ESCENA: ScreenView = {
  kind: 'web',
  app: 'Escritorio',
  url: 'oficina',
  secure: true,
  brand: 'Puesto de trabajo',
  title: 'Pantalla desbloqueada',
  subtitle: 'Tu compañero se levantó unos minutos',
  datos: [
    {
      etiqueta: 'Acceso',
      valor: 'Sistema de nómina (RRHH) - sesión activa',
      senal: 'peligro',
    },
    {
      etiqueta: 'Correos abiertos',
      valor: 'Carpeta de proyectos confidenciales',
      senal: 'peligro',
    },
    {
      etiqueta: 'Aplicación de banca',
      valor: 'App de transferencias del área contable',
      senal: 'peligro',
    },
  ],
  aviso:
    'Tu compañero de equipo se levantó de su escritorio para ir por café. Su pantalla quedó completamente desbloqueada con tres ventanas importantes abiertas. Estarán fuera unos 10 minutos.',
  opciones: [
    {
      texto: 'Revisar rápidamente los correos de la carpeta confidencial',
      goto: 'e_lee',
      label: 'Accedió a información confidencial sin permiso',
    },
    {
      texto: 'Hacer una transferencia de prueba desde la app contable',
      goto: 'e_modifica',
      label: 'Intentó manipular sistemas financieros sin autorización',
    },
    {
      texto: 'Esperar a que regrese sin tocar nada',
      goto: 'e_espera',
      label: 'Respetó el acceso sin vigilancia',
    },
    {
      texto: 'Bloquear la pantalla (Ctrl+Alt+L o Win+L)',
      goto: 'e_bloquea',
      label: 'Actuó para proteger datos ajenos',
    },
  ],
  fields: [],
  button: '',
}

export const STORY: Story<ScreenNode> = {
  n1: { kind: 'scene', view: ESCENA },
  e_lee: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Violaste la privacidad y confidencialidad',
    outcome:
      'Acceder a los correos de un compañero sin permiso es una falta grave. El hecho de que la pantalla esté sin vigilancia no te da derecho a usarla. Es tanto una violación de confianza como una violación de políticas de acceso.',
  },
  e_modifica: {
    kind: 'bad',
    view: ESCENA,
    verdict: 'Cometiste fraude al intentar manipular transferencias',
    outcome:
      'Intentar usar el acceso de otra persona para hacer transacciones financieras es fraude. Es uno de los ataques más graves: aprovechaste la confianza y la sesión abierta para intentar operaciones que no te autorizan. Esto tendría consecuencias legales graves.',
  },
  e_espera: {
    kind: 'partial',
    view: ESCENA,
    verdict: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No hiciste nada incorrecto personalmente, pero tampoco actuaste para reducir el riesgo. La pantalla sigue desbloqueada y disponible para cualquiera que pase. Un tercero podría ver datos o hacer cosas comprometedoras.',
  },
  e_bloquea: {
    kind: 'good',
    view: ESCENA,
    verdict: 'Actuaste correctamente para proteger datos ajenos',
    outcome:
      'Perfecto. Bloquear la pantalla de un compañero que se olvidó es lo correcto: proteges sus datos, su sesión y su responsabilidad frente a la empresa. Es una acción defensiva que muestra conciencia de seguridad.',
  },
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'peligro',
    pantalla: 'n1',
    texto:
      'Una <b>pantalla desbloqueada con sesiones activas</b> es un riesgo para los datos y para quien la dejó: cualquiera podría usarla, ver información o hacer cosas en su nombre.',
  },
]

const RESUMEN = 'Tu compañero dejó su pantalla desbloqueada con sistemas importantes abiertos.'

const CONTEXTO: Contexto = {
  antes: 'Trabajas en un ambiente de oficina donde cada persona es responsable de bloquear su computadora.',
  ahora: (
    <>
      <strong>Pausa de café.</strong> Tu compañero se levanta de su escritorio diciendo {'"'}me voy un momentito{'"'}
      . Cuando se va, ves que su pantalla quedó completamente desbloqueada con tres cosas abiertas: el sistema de
      nómina (donde están todos los salarios), su correo con proyectos confidenciales, y la app de banca para hacer
      transferencias desde el área contable.
    </>
  ),
}

function PantallaDesbloqueada() {
  const { displayName } = useAuth()
  const [started, setStarted] = useState(false)

  if (!started) {
    return (
      <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
        <main className={styles.mainArea}>
          <p className={styles.introText}>
            Hola, {displayName}. Esto es lo que te está pasando:
          </p>

          <div className={styles.instructionsBox}>
            <p className={styles.instructionsTitle}>Antes de esto</p>
            <p className={styles.summary}>
              Trabajas en una oficina donde cada persona es responsable de bloquear su pantalla cuando se aleja del escritorio.
              Es una norma básica de seguridad: nunca debes dejar una máquina desbloqueada, aunque solo sea por un momento.
            </p>
          </div>

          <div className={styles.instructionsBox}>
            <p className={styles.instructionsTitle}>Lo que acaba de pasar</p>
            <p className={styles.summary}>
              <strong>Pausa de café.</strong> Acabas de llegar a tu escritorio después del café y ves algo preocupante: la pantalla de tu compañero
              quedó completamente desbloqueada. Tiene abiertos tres sistemas: el sistema de nómina (con salarios de todo el equipo), su correo con
              proyectos confidenciales, y la app de banca para hacer transferencias desde el área contable.
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
      escenarioId="fisico/pantalla-desbloqueada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      story={STORY}
      senales={SENALES}
      rule='Regla de oro: <b>nunca dejes tu pantalla desbloqueada</b>, y si ves una abierta, bloquéala discretamente. No accedas, no modifiques, no hagas nada con ella —solo protégela del siguiente que pase.'
      restartLabel="↻ Repetir el escenario"
      instruccion={
        <p className="text-lg leading-relaxed text-body">
          Ves la pantalla de tu compañero desbloqueada con datos sensibles abiertos. <strong>¿Qué haces?</strong> Elige la
          acción que consideres más apropriada.
        </p>
      }
      pista={
        <p>
          La acción defensiva correcta es bloquear la pantalla. No accedas a los datos aunque puedas, no importa la
          razón.
        </p>
      }
    />
  )
}

export default PantallaDesbloqueada
