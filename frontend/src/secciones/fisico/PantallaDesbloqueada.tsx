import { useState } from 'react'
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
  const [doorOpened, setDoorOpened] = useState(false)

  const pantalla = (
    <div
      id="pantalla-escenario"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2a3f5f 0%, #1a2a3a 100%)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes doorOpen {
          from {
            transform: rotateY(0deg);
            opacity: 1;
          }
          to {
            transform: rotateY(-90deg);
            opacity: 0;
          }
        }
        @keyframes officeReveal {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
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
        .door-container {
          perspective: 1000px;
          width: 300px;
          height: 500px;
        }
        .door {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #8b6f47 0%, #a0826d 50%, #8b6f47 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          cursor: pointer;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          animation: ${doorOpened ? 'doorOpen 0.8s ease-out forwards' : 'none'};
        }
        .door:hover:not(.opened) {
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transform: scale(1.02);
        }
        .door-knob {
          width: 20px;
          height: 20px;
          background: radial-gradient(circle at 30% 30%, #ffeb3b, #fbc02d);
          border-radius: 50%;
          position: absolute;
          right: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset -1px -1px 3px rgba(0, 0, 0, 0.2);
        }
        .door-label {
          font-size: 24px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.6);
          text-align: center;
          margin-bottom: 10px;
        }
        .door-hint {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.5);
          margin-top: 20px;
          font-style: italic;
        }
        .office-interior {
          animation: officeReveal 0.8s ease-out forwards;
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
      `}</style>

      {!doorOpened ? (
        <div className="door-container">
          <div className="door" onClick={() => setDoorOpened(true)}>
            <div className="door-label">OFICINA</div>
            <div className="door-knob" />
            <div className="door-hint">Haz clic para entrar</div>
          </div>
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f1ed',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <style>{`
            .desk-svg-container {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              perspective: 1200px;
            }
            svg {
              max-width: 95%;
              max-height: 95%;
              filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.3));
            }
          `}</style>

          <div className="desk-svg-container">
            <svg viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" style={{ background: 'linear-gradient(to bottom, #d8d4cc 0%, #a8a4a0 100%)' }}>
              <defs>
                <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#e8e4dc', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#d0ccc4', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8a7a6a', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#6a5a4a', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Paredes y piso */}
              <rect x="0" y="0" width="1200" height="500" fill="url(#wallGrad)" />
              <rect x="0" y="500" width="1200" height="400" fill="#7a7470" />

              {/* Ventana en la pared */}
              <rect x="950" y="80" width="180" height="150" fill="#87ceeb" stroke="#8b7355" strokeWidth="8" rx="4" />

              {/* Mesa - vista frontal */}
              <g>
                {/* Tablero de la mesa */}
                <path d="M 250 500 L 950 500 L 980 650 L 220 650 Z" fill="url(#deskGrad)" filter="drop-shadow(0 20px 50px rgba(0,0,0,0.5))" />

                {/* Patas izquierda */}
                <rect x="280" y="650" width="50" height="150" fill="#4a3a2a" />
                {/* Patas derecha */}
                <rect x="890" y="650" width="50" height="150" fill="#4a3a2a" />
              </g>

              {/* Monitor encima de la mesa */}
              <g transform="translate(600, 380)">
                {/* Pedestal del monitor */}
                <rect x="-80" y="50" width="160" height="35" fill="#2a2a2a" rx="3" />
                <rect x="-70" y="85" width="140" height="15" fill="#1a1a1a" />

                {/* Cuerpo del monitor */}
                <rect x="-200" y="-180" width="400" height="240" fill="#1a1a1a" rx="20" filter="drop-shadow(0 15px 40px rgba(0,0,0,0.6))" />

                {/* Pantalla */}
                <rect x="-190" y="-170" width="380" height="220" fill="#0f1629" rx="15" />

                {/* Contenido de la pantalla */}
                <text x="0" y="-120" fontSize="24" fill="#ff6464" textAnchor="middle" fontWeight="bold">Sesión activa</text>
                <text x="0" y="-85" fontSize="20" fill="#ffffff" textAnchor="middle" fontWeight="600">Sistema de nómina (RRHH)</text>
                <line x1="-150" y1="-70" x2="150" y2="-70" stroke="#444" strokeWidth="1" />
                <text x="0" y="-45" fontSize="16" fill="#cccccc" textAnchor="middle">Proyectos confidenciales abiertos</text>
                <text x="0" y="-20" fontSize="16" fill="#cccccc" textAnchor="middle">Transferencias bancarias disponibles</text>
                <text x="0" y="5" fontSize="16" fill="#cccccc" textAnchor="middle">Sesión sin bloqueo</text>

                {/* Glow del monitor */}
                <rect x="-190" y="-170" width="380" height="220" fill="none" stroke="#5599ff" strokeWidth="2" opacity="0.4" rx="15" />
              </g>

              {/* Decorativos en la mesa */}
              {/* Teclado */}
              <ellipse cx="350" cy="560" rx="80" ry="40" fill="#4a4a4a" opacity="0.5" />
              {/* Mouse */}
              <circle cx="820" cy="580" r="25" fill="#5a5a5a" opacity="0.5" />
            </svg>
          </div>
        </div>
      )}
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
    <div style={{ width: '100%' }}>
      <style>{`
        .options-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
          width: 100%;
        }
        .option-btn {
          position: relative;
          padding: 24px 28px;
          background: linear-gradient(135deg, #2a3f5f 0%, #1a2a3a 100%);
          border: 2px solid #4a6f9f;
          border-radius: 12px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          line-height: 1.5;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .option-btn:hover {
          background: linear-gradient(135deg, #3a5f7f 0%, #2a3a5a 100%);
          border-color: #6a9fdf;
          box-shadow: 0 15px 45px rgba(74, 111, 159, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .option-btn:active {
          transform: translateY(0);
        }
        .prompt-text {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          text-align: center;
        }
      `}</style>

      <div className="prompt-text">¿Qué haces con la pantalla desbloqueada?</div>
      <div className="options-container">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.label}
            type="button"
            onClick={() => engine.choose(opcion.goto, opcion.label)}
            className="option-btn"
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
