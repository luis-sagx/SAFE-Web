import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import DossierHeader from '../../components/ui/DossierHeader'
import FlashOverlay from '../../components/ui/FlashOverlay'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import { useCountdown } from '../../hooks/useCountdown'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import dossierTheme from '../../styles/dossier-theme.module.css'
import styles from './Foto.module.css'

type ItemKey =
  | 'monitor'
  | 'sticky'
  | 'folder'
  | 'badge'
  | 'phone'
  | 'notebook'
  | 'mug'
  | 'plant'

interface Item {
  isRisk: boolean
  label: string
  // Solo los objetos de riesgo llevan retroalimentación.
  fixedFeedback?: string
  riskFeedback?: string
}

interface Tooltip {
  x: number
  y: number
  text: string
}

interface Level {
  label: string
  time: number
  npc: string
  slotA: ItemKey
  slotB: ItemKey
}

interface SessionResult {
  label: string
  exposed: number
  total: number
}

type FixedState = Partial<Record<ItemKey, boolean>>

const ITEMS: Record<ItemKey, Item> = {
  monitor: {
    isRisk: true,
    label: 'Pantalla con el sistema de nómina abierto',
    fixedFeedback: 'Bien hecho: bloqueaste la pantalla antes de la foto. Ningún dato quedó expuesto.',
    riskFeedback:
      'La pantalla quedó visible en la foto publicada. Cualquiera que vea el boletín (interno o en redes) pudo ver datos de nómina de fondo.',
  },
  sticky: {
    isRisk: true,
    label: 'Nota adhesiva con la contraseña del wifi escrita a mano',
    fixedFeedback: 'Bien hecho: quitaste la nota antes de la foto.',
    riskFeedback:
      'La nota con la contraseña "Of2026*Net!" quedó visible y legible en la foto publicada, cualquiera que la vea puede usarla.',
  },
  folder: {
    isRisk: true,
    label: 'Carpeta con documentos de un cliente sobre el escritorio',
    fixedFeedback: 'Bien hecho: guardaste la carpeta antes de la foto.',
    riskFeedback:
      'La carpeta con datos de un cliente quedó visible en la foto, información que no debería circular fuera de la empresa.',
  },
  badge: {
    isRisk: true,
    label: 'Gafete de acceso con el código de empleado visible hacia la cámara',
    fixedFeedback: 'Bien hecho: volteaste el gafete antes de la foto.',
    riskFeedback:
      'El código "ID 04521" de tu gafete de acceso quedó legible en la foto (en teoría, alguien podría intentar clonarlo o usarlo como referencia para un ataque físico).',
  },
  phone: {
    isRisk: true,
    label: 'Teléfono con un código de verificación visible en la pantalla de bloqueo',
    fixedFeedback: 'Bien hecho: guardaste o bloqueaste el teléfono antes de la foto.',
    riskFeedback:
      'El código de verificación "482913" de la notificación quedó legible en la foto, alguien podría usarlo para entrar a una cuenta tuya o de la empresa.',
  },
  notebook: {
    isRisk: true,
    label: 'Libreta abierta con la contraseña del wifi anotada a mano',
    fixedFeedback: 'Bien hecho: cerraste la libreta antes de la foto.',
    riskFeedback: 'La contraseña "Ofc-2026*Wpa" anotada en la libreta quedó legible en la foto publicada.',
  },
  mug: { isRisk: false, label: 'Taza de café' },
  plant: { isRisk: false, label: 'Planta pequeña' },
}

const LEVELS: Level[] = [
  {
    label: 'Nivel 1 · Tu escritorio',
    time: 20,
    npc: 'Valeria, de Comunicaciones: "¡Hola! Estoy armando el boletín interno de este mes, ¿te tomo una foto rápida en tu puesto? Solo será un segundo."',
    slotA: 'mug',
    slotB: 'plant',
  },
  {
    label: 'Nivel 2 · Cierre de mes',
    time: 16,
    npc: 'Valeria: "¡Otra vez yo! Necesitamos una foto para la sección \'un día en la oficina\'. ¿Lista en tu puesto?"',
    slotA: 'phone',
    slotB: 'plant',
  },
  {
    label: 'Nivel 3 · Antes de la reunión',
    time: 12,
    npc: 'Valeria: "Última foto, lo prometo (es para la portada del boletín trimestral). ¿Nos das un segundo?"',
    slotA: 'phone',
    slotB: 'notebook',
  },
]

const CORE_KEYS: ItemKey[] = ['monitor', 'sticky', 'folder', 'badge']

const TOOLTIP_POS: Partial<Record<ItemKey, { x: number; y: number }>> = {
  mug: { x: 410 + 12, y: 150 },
  plant: { x: 60 + 18, y: 135 },
}

const POSITIONS: Partial<Record<ItemKey, { x: string; y: string; w: string; h: string }>> = {
  monitor: { x: '30%', y: '20%', w: '26%', h: '27%' },
  sticky: { x: '51%', y: '20%', w: '10%', h: '12%' },
  folder: { x: '65%', y: '48%', w: '13%', h: '16%' },
  badge: { x: '23%', y: '60%', w: '6%', h: '14%' },
  phone: { x: '80%', y: '46%', w: '6%', h: '20%' },
  notebook: { x: '10%', y: '47%', w: '16%', h: '15%' },
}

function activeItemsFor(levelIdx: number): ItemKey[] {
  const level = LEVELS[levelIdx]!
  return [...CORE_KEYS, level.slotA, level.slotB]
}

function initialFixedState(levelIdx: number): FixedState {
  const state: FixedState = {}
  activeItemsFor(levelIdx).forEach((key) => {
    if (ITEMS[key].isRisk) state[key] = false
  })
  return state
}

function SlotItem({
  itemKey,
  fixedState,
  onToggle,
  onNonRiskClick,
}: {
  itemKey: ItemKey
  fixedState: FixedState
  onToggle: (key: ItemKey) => void
  onNonRiskClick: (key: ItemKey) => void
}) {
  if (itemKey === 'mug') {
    return (
      <g className={styles.clickable} transform="translate(410,155)" onClick={() => onNonRiskClick('mug')}>
        <rect x="0" y="10" width="24" height="22" rx="3" fill="#fff9ec" stroke="#9c8a5e" strokeWidth="1.5" />
        <path d="M24 14 h6 a6 6 0 0 1 0 14 h-6" fill="none" stroke="#9c8a5e" strokeWidth="1.5" />
      </g>
    )
  }
  if (itemKey === 'plant') {
    return (
      <g className={styles.clickable} transform="translate(60,140)" onClick={() => onNonRiskClick('plant')}>
        <rect x="8" y="34" width="20" height="16" rx="2" fill="#cbb98c" />
        <path d="M18 34 Q10 20 18 6 Q26 20 18 34" fill="#5b8a5a" />
        <path d="M18 34 Q26 22 34 12" stroke="#5b8a5a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (itemKey === 'phone') {
    return (
      <g className={styles.clickable} transform="translate(408,140)" onClick={() => onToggle('phone')}>
        {!fixedState.phone ? (
          <g>
            <rect x="0" y="0" width="26" height="58" rx="4" fill="#1b232c" />
            <rect x="2" y="4" width="22" height="50" rx="2" fill="#3a4552" />
            <rect x="3" y="20" width="20" height="20" rx="1.5" fill="#eef1f2" />
            <text x="13" y="28" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="4" fill="#4a5560">
              Código:
            </text>
            <text
              x="13"
              y="36"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono',monospace"
              fontWeight="600"
              fontSize="5.2"
              fill="#1b232c"
            >
              482913
            </text>
          </g>
        ) : (
          <rect x="0" y="0" width="26" height="58" rx="4" fill="#0d1319" />
        )}
      </g>
    )
  }
  if (itemKey === 'notebook') {
    return (
      <g className={styles.clickable} transform="translate(50,140)" onClick={() => onToggle('notebook')}>
        {!fixedState.notebook ? (
          <g>
            <rect x="0" y="0" width="80" height="44" rx="2" fill="#f7f3e6" stroke="#b7a97e" strokeWidth="1.2" />
            <line x1="38" y1="3" x2="38" y2="41" stroke="#b7a97e" strokeWidth="1" />
            <path d="M6 12 h24 M6 19 h28 M6 26 h20" stroke="#9c8e6a" strokeWidth="1" />
            <text x="60" y="17" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fill="#5f5238">
              WiFi oficina:
            </text>
            <text
              x="60"
              y="28"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono',monospace"
              fontWeight="600"
              fontSize="5.2"
              fill="#2b2308"
            >
              Ofc-2026*Wpa
            </text>
          </g>
        ) : (
          <g>
            <rect x="6" y="6" width="68" height="32" rx="2" fill="#cfae7c" />
            <path d="M18 22 l2 6 h24 l7-14" stroke="#5f4a2a" strokeWidth="1" fill="none" />
          </g>
        )}
      </g>
    )
  }
  return null
}

function DeskSVG({
  level,
  fixedState,
  onToggle,
  onNonRiskClick,
  tooltip,
}: {
  level: Level
  fixedState: FixedState
  onToggle: (key: ItemKey) => void
  onNonRiskClick: (key: ItemKey) => void
  tooltip: Tooltip | null
}) {
  return (
    <svg viewBox="0 0 2000 1200">
      <defs>
        <linearGradient id="deskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5f7f9" />
          <stop offset="100%" stopColor="#eef1f5" />
        </linearGradient>
      </defs>
      <rect width="2000" height="1200" fill="url(#deskGradient)" />
      <rect y="240" width="2000" height="40" fill="#d9dfe5" />
      <rect x="80" y="760" width="1840" height="80" fill="#d4b896" />
      <rect x="80" y="680" width="1840" height="80" fill="#e0c4a0" />

      <g className={styles.clickable} onClick={() => onToggle('monitor')}>
        <rect x="600" y="240" width="480" height="320" rx="16" fill="#1b232c" />
        <rect x="820" y="560" width="80" height="64" fill="#3a4552" />
        {!fixedState.monitor ? (
          <g>
            <rect x="640" y="280" width="400" height="40" fill="#b4342f" opacity="0.75" />
            <rect x="640" y="345" width="320" height="32" fill="#8fa0b0" opacity="0.6" />
            <rect x="640" y="400" width="360" height="32" fill="#8fa0b0" opacity="0.6" />
            <rect x="640" y="456" width="280" height="32" fill="#8fa0b0" opacity="0.6" />
            <text x="840" y="528" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="32" fill="#e8b9b3">
              NÓMINA_2026.xlsx
            </text>
          </g>
        ) : (
          <g>
            <rect x="640" y="280" width="400" height="240" fill="#05080b" />
            <circle cx="840" cy="400" r="40" fill="none" stroke="#8fa0b0" strokeWidth="10" />
            <rect x="820" y="400" width="40" height="32" fill="#8fa0b0" />
          </g>
        )}
      </g>

      <g className={styles.clickable} onClick={() => onToggle('sticky')}>
        {!fixedState.sticky && (
          <g>
            <rect
              x="1024"
              y="240"
              width="192"
              height="144"
              fill="#f4d94a"
              stroke="#c9ad1f"
              strokeWidth="4"
              transform="rotate(6 1120 312)"
            />
            <text
              x="1120"
              y="287"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono',monospace"
              fontSize="27"
              fill="#4a3d0d"
              transform="rotate(6 1120 312)"
            >
              Clave wifi:
            </text>
            <text
              x="1120"
              y="331"
              textAnchor="middle"
              fontFamily="'IBM Plex Mono',monospace"
              fontWeight="600"
              fontSize="30"
              fill="#2b2308"
              transform="rotate(6 1120 312)"
            >
              Of2026*Net!
            </text>
          </g>
        )}
      </g>

      <g className={styles.clickable} onClick={() => onToggle('folder')}>
        {!fixedState.folder ? (
          <g>
            <rect x="1320" y="600" width="240" height="168" rx="8" fill="#e0d4b0" stroke="#9c8a5e" strokeWidth="5" />
            <rect x="1320" y="600" width="240" height="40" fill="#b4342f" opacity="0.7" />
            <text x="1440" y="688" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="32" fill="#5f5238">
              Cliente XYZ
            </text>
          </g>
        ) : (
          <g>
            <rect x="1320" y="704" width="240" height="64" rx="8" fill="#cfae7c" />
            <text x="1440" y="747" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="32" fill="#5f4a2a">
              guardado
            </text>
          </g>
        )}
      </g>

      <g className={styles.clickable} transform="translate(480,740)" onClick={() => onToggle('badge')}>
        {!fixedState.badge ? (
          <g>
            <rect x="0" y="0" width="104" height="144" rx="11" fill="#fff9ec" stroke="#9c8a5e" strokeWidth="6" />
            <rect x="20" y="20" width="64" height="40" fill="#2c3e50" />
            <text x="52" y="87" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="20" fill="#1b232c">
              ID 04521
            </text>
            <rect x="20" y="104" width="64" height="12" fill="#1b232c" />
            <rect x="20" y="124" width="64" height="12" fill="#1b232c" />
          </g>
        ) : (
          <rect x="0" y="0" width="104" height="144" rx="11" fill="#c7bda1" stroke="#9c8a5e" strokeWidth="6" />
        )}
      </g>

      <SlotItem itemKey={level.slotA} fixedState={fixedState} onToggle={onToggle} onNonRiskClick={onNonRiskClick} />
      <SlotItem itemKey={level.slotB} fixedState={fixedState} onToggle={onToggle} onNonRiskClick={onNonRiskClick} />

      {tooltip && (
        <g>
          <rect className={styles.tooltipBg} x={tooltip.x - 70} y={tooltip.y - 34} width="140" height="24" rx="5" />
          <text className={styles.tooltipHint} x={tooltip.x} y={tooltip.y - 17}>
            {tooltip.text}
          </text>
        </g>
      )}
    </svg>
  )
}

function Foto() {
  const { displayName } = useAuth()
  const run = useScenarioRun('fisico/foto')
  const navigate = useNavigate()

  const [levelIndex, setLevelIndex] = useState(0)
  const [fixedState, setFixedState] = useState(() => initialFixedState(0))
  const [finished, setFinished] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flash = useFlashTransition()

  const level = LEVELS[levelIndex]!
  const isLastLevel = levelIndex === LEVELS.length - 1

  const timeLeft = useCountdown(level.time, {
    running: !finished,
    tickMs: 100,
    onExpire: () => handleTakePhoto(),
  })

  const activeItems = activeItemsFor(levelIndex)
  const riskKeysThisLevel = activeItems.filter((k) => ITEMS[k].isRisk)
  const exposedRisks = riskKeysThisLevel.filter((k) => !fixedState[k])
  const fixedRisks = riskKeysThisLevel.filter((k) => fixedState[k])

  const gaugeColor = timeLeft > level.time / 2 ? 'var(--safe)' : timeLeft > level.time / 4 ? 'var(--amber)' : 'var(--danger)'

  function handleToggle(key: ItemKey) {
    if (finished) return
    setFixedState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleNonRiskClick(key: ItemKey) {
    const pos = TOOLTIP_POS[key]
    if (!pos) return
    setTooltip({ x: pos.x, y: pos.y, text: 'No hace falta ocultar esto' })
    clearTimeout(tooltipTimeoutRef.current)
    tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 1400)
  }

  function handleTakePhoto() {
    if (finished) return
    setFinished(true)
    run.recordDecision({
      nivel: level.label,
      expuestos: exposedRisks.length,
      total: riskKeysThisLevel.length,
    })

    const resultado = {
      label: level.label,
      exposed: exposedRisks.length,
      total: riskKeysThisLevel.length,
    }

    flash.trigger(() => {
      setShowReport(true)
      setSessionResults((prev) => {
        const todos = [...prev, resultado]

        if (isLastLevel) {
          const expuestos = todos.reduce((suma, r) => suma + r.exposed, 0)
          void run.finish({
            endingId: `expuestos-${expuestos}`,
            outcome: expuestos === 0 ? 'CORRECTO' : expuestos <= 2 ? 'PARCIAL' : 'INCORRECTO',
          })
        }

        return todos
      })
    }, 250)
  }

  function handleNextLevel() {
    const nextIdx = levelIndex + 1
    setLevelIndex(nextIdx)
    setFixedState(initialFixedState(nextIdx))
    setFinished(false)
    setShowReport(false)
  }

  function handleRestart() {
    run.restart()
    setLevelIndex(0)
    setSessionResults([])
    setFixedState(initialFixedState(0))
    setFinished(false)
    setShowReport(false)
  }

  let title
  let resLevel
  let summary
  if (exposedRisks.length === 0) {
    title = 'Escritorio impecable'
    resLevel = 'safe'
    summary = 'Acomodaste todo antes de la foto. Ningún dato sensible quedó expuesto en la publicación.'
  } else if (exposedRisks.length <= 2) {
    title = 'Buen intento, pero algo se coló'
    resLevel = 'danger'
    summary = 'La mayoría del escritorio quedó bien, pero uno o dos elementos sensibles se colaron en la foto publicada.'
  } else {
    title = 'La foto reveló más de lo que crees'
    resLevel = 'danger'
    summary =
      'Varios elementos sensibles quedaron perfectamente visibles en una foto que ahora circula en el boletín interno o en redes de la empresa.'
  }

  const contexto: Contexto = {
    antes: (
      <>
        Trabajas en una oficina donde se fotografía a los empleados regularmente para materiales
        internos. Tu escritorio, como el de todos, tiene objetos que contienen información sensible:
        pantallas con datos de nómina, notas con contraseñas, carpetas de clientes, gafetes con
        códigos de acceso, teléfonos con notificaciones, libretas con anotaciones.
      </>
    ),
    ahora: (
      <>
        <strong>Hace unos minutos</strong> Valeria de Comunicaciones te avisó que viene a fotografiar
        tu puesto para el boletín interno. La foto se publicará en la intranet y en las redes de la
        empresa. Tienes poco tiempo para preparar tu escritorio: debes ocultar o guardar cualquier
        objeto que pueda revelar información sensible antes de que dispare la cámara.
      </>
    ),
  }

  const pantalla = (
    <div className={`${dossierTheme.dossierTheme} ${styles.app}`}>
      <DossierHeader
        caseLabel="RIESGO FÍSICO"
        secondTab={`NIVEL ${levelIndex + 1}/${LEVELS.length}`}
        riskLabel="TIEMPO"
        gaugePercent={(timeLeft / level.time) * 100}
        gaugeValueText={`${Math.ceil(timeLeft)}s`}
        gaugeColor={gaugeColor}
        participantName={displayName}
        participantRole=""
      />

      <main className={styles.mainArea}>
        <p className={styles.npcLine}>
          {finished ? 'Valeria: "¡Listo, gracias! Ya la subo al boletín."' : level.npc}
        </p>

        <div
          className={`${styles.deskWrap} ${showReport ? styles.resultFrame : ''}`}
          style={showReport ? { position: 'relative' } : undefined}
        >
          <DeskSVG
            level={level}
            fixedState={fixedState}
            onToggle={handleToggle}
            onNonRiskClick={handleNonRiskClick}
            tooltip={tooltip}
          />
          {showReport && (
            <>
              <span className={styles.resultBadge}>PUBLICADO EN EL BOLETÍN</span>
              {exposedRisks.map((k) => {
                const p = POSITIONS[k]
                return p ? (
                  <div
                    key={k}
                    className={styles.callout}
                    style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
                  />
                ) : null
              })}
            </>
          )}
        </div>

        {!finished && (
          <div className={styles.actionRow}>
            <button type="button" className={styles.snapBtn} onClick={handleTakePhoto}>
              Listo, tomen la foto
            </button>
          </div>
        )}
        {!finished && (
          <p className={styles.hintText}>Haz clic en los objetos de riesgo del escritorio para ocultarlos antes de que se acabe el tiempo.</p>
        )}
      </main>

      <FlashOverlay active={flash.active} />
    </div>
  )

  const decision = showReport ? (
    <div className={styles.report} style={{ marginTop: 18 }}>
      <span className={`${styles.reportStamp} ${styles[resLevel]}`}>
        FOTO PUBLICADA ({level.label.toUpperCase()})
      </span>
      <h2>{title}</h2>
      <p className={styles.summary}>{summary}</p>
      <div>
        {riskKeysThisLevel.map((k) => (
          <div key={k} className={styles.recapItem}>
            <span>{ITEMS[k].label}</span>
            <span className={`${styles.recapTag} ${fixedState[k] ? styles.safe : styles.danger}`}>
              {fixedState[k] ? 'OCULTO' : 'EXPUESTO'}
            </span>
          </div>
        ))}
      </div>

      {exposedRisks.length > 0 && (
        <div className={styles.report} style={{ marginTop: 8, padding: 0 }}>
          {exposedRisks.map((k) => (
            <p key={k} className={styles.summary} style={{ marginBottom: 8 }}>
              <strong>{ITEMS[k].label}:</strong> {ITEMS[k].riskFeedback}
            </p>
          ))}
        </div>
      )}

      {fixedRisks.length > 0 && (
        <div className={styles.report} style={{ marginTop: 4, padding: 0 }}>
          {fixedRisks.map((k) => (
            <p key={k} className={styles.summary} style={{ marginBottom: 8, color: '#2f6b52' }}>
              <strong>{ITEMS[k].label}:</strong> {ITEMS[k].fixedFeedback}
            </p>
          ))}
        </div>
      )}

      {isLastLevel ? (
        <div className={styles.report} style={{ marginTop: 14 }}>
          <h2 style={{ fontSize: '1.15rem' }}>Resumen de la sesión</h2>
          <div>
            {sessionResults.map((r) => (
              <div key={r.label} className={styles.recapItem}>
                <span>{r.label}</span>
                <span className={`${styles.recapTag} ${r.exposed === 0 ? styles.safe : styles.danger}`}>
                  {r.exposed}/{r.total} expuestos
                </span>
              </div>
            ))}
          </div>
          <button type="button" className={styles.restartBtn} onClick={() => navigate('/escenario/fisico/baiting')}>
            Ir al siguiente escenario →
          </button>
          <button type="button" className={styles.restartBtn} onClick={handleRestart} style={{ marginTop: '10px', background: 'transparent', color: 'var(--color-ink)', border: '2px solid var(--color-ink)' }}>
            Repetir desde el nivel 1
          </button>
        </div>
      ) : (
        <button type="button" className={styles.restartBtn} onClick={handleNextLevel}>
          Siguiente nivel →
        </button>
      )}
    </div>
  ) : null

  return (
    <EscenarioLayout
      escenarioId="fisico/foto"
      resumen="Prepara tu escritorio antes de que tomen la foto para el boletín"
      contexto={contexto}
      nota="Haz clic en los elementos de riesgo para ocultarlos. Tienes poco tiempo antes de que disparen la cámara."
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      ocultarDecision={!showReport}
      resultado={undefined}
      onEmpezar={run.restart}
      dispositivo="escritorio"
    />
  )
}

export default Foto
