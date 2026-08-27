import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import type { Senal } from '../../components/ui/PanelVeredicto'
import PanelVeredicto from '../../components/ui/PanelVeredicto'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

interface Opcion {
  texto: string
  goto: string
  label: string
}

const OPCIONES: Opcion[] = [
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
]

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  e_lee: {
    kind: 'bad',
    verdict: 'Violaste la privacidad y confidencialidad',
    outcome:
      'Acceder a los correos de un compañero sin permiso es una falta grave. El hecho de que la pantalla esté sin vigilancia no te da derecho a usarla. Es tanto una violación de confianza como una violación de políticas de acceso.',
  },
  e_modifica: {
    kind: 'bad',
    verdict: 'Cometiste fraude al intentar manipular transferencias',
    outcome:
      'Intentar usar el acceso de otra persona para hacer transacciones financieras es fraude. Es uno de los ataques más graves: aprovechaste la confianza y la sesión abierta para intentar operaciones que no te autorizan. Esto tendría consecuencias legales graves.',
  },
  e_espera: {
    kind: 'partial',
    verdict: 'No actuaste, pero dejaste el riesgo activo',
    outcome:
      'No hiciste nada incorrecto personalmente, pero tampoco actuaste para reducir el riesgo. La pantalla sigue desbloqueada y disponible para cualquiera que pase. Un tercero podría ver datos o hacer cosas comprometedoras.',
  },
  e_bloquea: {
    kind: 'good',
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

const REGLA =
  'Regla de oro: <b>nunca dejes tu pantalla desbloqueada</b>, y si ves una abierta, bloquéala discretamente. No accedas, no modifiques, no hagas nada con ella —solo protégela del siguiente que pase.'

function PantallaDesbloqueada() {
  const engine = useStoryEngine(STORY, 'n1', 'fisico/pantalla-desbloqueada')

  const pantalla = (
    <div
      id="pantalla-escenario"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes monitorGlow {
          0% {
            box-shadow: 0 0 20px rgba(100, 200, 255, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.8);
          }
          50% {
            box-shadow: 0 0 40px rgba(100, 200, 255, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.8);
          }
          100% {
            box-shadow: 0 0 20px rgba(100, 200, 255, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.8);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .monitor-container {
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .monitor-bezel {
          background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: monitorGlow 3s ease-in-out infinite;
        }
        .monitor-screen {
          background: #0a0e27;
          border-radius: 4px;
          overflow: hidden;
          aspect-ratio: 16 / 9;
          width: 100%;
          max-width: 900px;
          position: relative;
        }
        .desktop-content {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #0f1629 0%, #1a2847 100%);
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #fff;
        }
        .taskbar {
          display: flex;
          gap: 8px;
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .taskbar-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(100, 150, 200, 0.2);
          border: 1px solid rgba(100, 150, 200, 0.3);
          border-radius: 4px;
          font-size: 12px;
          color: #64b4ff;
        }
        .warning-badge {
          background: rgba(255, 100, 100, 0.2);
          border: 1px solid rgba(255, 100, 100, 0.4);
          color: #ff6464;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="monitor-container">
        <div className="monitor-bezel">
          <div className="monitor-screen">
            <div className="desktop-content">
              <div>
                <div className="warning-badge">
                  ⚠️ Sesión activa - Sistema de nómina (RRHH)
                </div>
                <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
                  Puesto de trabajo - Escritorio
                </h2>
                <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.8' }}>
                  <p>📧 Carpeta de correos: Proyectos confidenciales (abierta)</p>
                  <p>💰 App de banca: Transferencias (abierta)</p>
                  <p>👤 Sesión: activa sin bloqueo</p>
                </div>
              </div>

              <div className="taskbar">
                <div className="taskbar-item">📧 Correo</div>
                <div className="taskbar-item">💳 Banca</div>
                <div className="taskbar-item">📊 RH</div>
                <div className="taskbar-item">⏰ 14:30</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="fisico/pantalla-desbloqueada"
      node={engine.node}
      senales={SENALES}
      regla={REGLA}
      restartLabel="↻ Repetir el escenario"
      onRestart={engine.restart}
      contenedorId="pantalla-escenario"
    />
  ) : (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <div className="grid gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.label}
            type="button"
            onClick={() => engine.choose(opcion.goto, opcion.label)}
            className="rounded-md border border-hairline-strong bg-surface px-4 py-3 text-left text-base transition hover:border-hairline-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/pantalla-desbloqueada"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default PantallaDesbloqueada
