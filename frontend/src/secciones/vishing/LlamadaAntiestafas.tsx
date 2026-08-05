import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'
import StoryChoices from '../../components/ui/StoryChoices'
import StoryResultPanel from '../../components/ui/StoryResultPanel'
import styles from './LlamadaAntiestafas.module.css'

interface CallNode extends StoryNode {
  caller?: string[]
}

const STORY: Story<CallNode> = {
  n1: {
    kind: 'scene',
    caller: [
      '¡Muy buenas tardes! Le llamo de Almacenes La Ganga. ¡Felicidades! Su número resultó ganador de una cocina de inducción en nuestro sorteo.',
    ],
    choices: [
      { label: 'Escuchar qué más dice.', goto: 'n2' },
      { label: 'Decir: “yo no participé en ningún sorteo”.', goto: 'n2b' },
    ],
  },
  n2: {
    kind: 'scene',
    caller: [
      'El sistema la eligió al azar, no se preocupe. Solo debe pagar cuarenta dólares del impuesto de entrega.',
      'Deposítelos a la cuenta personal de mi compañera María y hoy mismo le llevamos su cocina a la casa.',
    ],
    choices: [
      { label: 'Pagar los cuarenta dólares; es poco por una cocina.', goto: 'e_pago' },
      { label: 'Preguntar: “¿por qué debo pagar para recibir un premio?”', goto: 'n3' },
      { label: 'Decir: “voy a colgar y llamar yo al almacén para confirmar”.', goto: 'e_verifica' },
    ],
  },
  n2b: {
    kind: 'scene',
    caller: [
      'Ah, pero el sorteo es automático con su número de cédula, igual usted ganó.',
      'Solo pague el impuesto de entrega y su cocina llega hoy mismo, señora.',
    ],
    choices: [
      { label: 'Ceder; suena convincente.', goto: 'n3' },
      { label: 'Colgar: “si yo no participé, esto no es real”.', goto: 'e_instinto' },
    ],
  },
  n3: {
    kind: 'scene',
    caller: [
      'Mire, la promoción vence en una hora. Si no paga ahora mismo, pierde la cocina y se la damos a otra persona.',
      '¿Le tomo los datos para el depósito ya?',
    ],
    choices: [
      { label: 'Apurarse y pagar antes de perderla.', goto: 'e_pago' },
      { label: 'No dejarse presionar: colgar y verificar con calma.', goto: 'e_verifica' },
    ],
  },
  e_pago: {
    kind: 'bad',
    verdict: 'Caíste en la estafa',
    outcome: 'Pagaste los cuarenta dólares a esa cuenta. La cocina nunca llegó y ese número dejó de contestar.',
  },
  e_verifica: {
    kind: 'good',
    verdict: 'No caíste · verificaste por tu cuenta',
    outcome: 'Colgaste y llamaste al número real del almacén. Allí no había ningún sorteo. No perdiste ni un centavo.',
  },
  e_instinto: {
    kind: 'good',
    verdict: 'No caíste · seguiste tu instinto',
    outcome: 'Colgaste sin dudar. Tenías razón: nadie gana un premio que nunca pidió.',
  },
  e_colgar: {
    kind: 'good',
    verdict: 'No caíste · colgaste la llamada',
    outcome: 'Colgaste. Nunca estás obligado a seguir escuchando: colgar es una defensa perfectamente válida.',
  },
  e_reject: {
    kind: 'good',
    verdict: 'No caíste · no contestaste',
    outcome:
      'Rechazaste una llamada de un número desconocido. Es una decisión válida y segura: no tienes que contestar a quien no conoces.',
  },
}

const SIGNALS = [
  'Un premio que <b>nunca pediste</b>.',
  'Te piden <b>pagar</b> para poder recibirlo.',
  'El dinero va a una <b>cuenta personal</b>, no a la empresa.',
  'Te meten <b>prisa</b>: “solo por hoy”.',
]
const RULE =
  'Regla de oro: <b>nunca pagues para recibir un premio</b>. Cuelga y llama tú al número oficial del negocio.'

const RESUMEN = 'Un número desconocido te llama diciendo que ganaste un sorteo.'

const CONTEXTO = (
  <>
    <p>
      Estás en tu casa, a media tarde. Suena el teléfono: un número que no tenés guardado y que
      nunca viste antes.
    </p>
    <p>
      No participaste en ningún sorteo ni dejaste tu número en ningún concurso, pero eso todavía no
      lo sabés cuando el teléfono suena.
    </p>
  </>
)

/// Mecánica, no historia: solo se muestra en el briefing.
const NOTA = (
  <p>
    Vas a poder contestar o rechazar la llamada, y si contestas, escuchar y decidir qué respondes en
    cada momento. Colgar es siempre una opción válida.
  </p>
)

function formatTime(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function LlamadaAntiestafas() {
  const engine = useStoryEngine(STORY, 'n1', 'vishing/llamada-antiestafas')
  const { current, node, isEnding, choose, restart } = engine

  const [phase, setPhase] = useState<'ringing' | 'active' | 'ended'>('ringing')
  const [seconds, setSeconds] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [choicesVisible, setChoicesVisible] = useState(false)
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1)
  const [replayToken, setReplayToken] = useState(0)
  const [audioNotice, setAudioNotice] = useState('')

  const speakingRef = useRef(false)
  const esVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const speechOK = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (isEnding) {
      setPhase('ended')
    }
  }, [isEnding])

  useEffect(() => {
    if (phase !== 'active') return undefined
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (!speechOK) {
      setAudioNotice('Tu navegador no reproduce voz; puedes leer la llamada igual.')
      return undefined
    }

    function loadVoices() {
      esVoicesRef.current = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang))
    }
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    const t = setTimeout(() => {
      if (!esVoicesRef.current.length) {
        setAudioNotice('Para escuchar la voz, usa Chrome o Edge con el sonido activado.')
      }
    }, 500)

    return () => clearTimeout(t)
  }, [speechOK])

  useEffect(() => {
    if (phase !== 'active' || node.kind !== 'scene') {
      return undefined
    }

    let cancelled = false
    setChoicesVisible(false)
    setActiveCaptionIndex(-1)

    if (!speechOK || !esVoicesRef.current.length) {
      setSpeaking(false)
      const t = setTimeout(() => {
        if (!cancelled) setChoicesVisible(true)
      }, 400)
      return () => {
        cancelled = true
        clearTimeout(t)
      }
    }

    speakingRef.current = true
    setSpeaking(true)
    let qi = 0

    function speakNext() {
      if (!speakingRef.current || cancelled) return
      if (qi >= (node.caller ?? []).length) {
        speakingRef.current = false
        setSpeaking(false)
        setChoicesVisible(true)
        return
      }
      const utterance = new SpeechSynthesisUtterance((node.caller ?? [])[qi])
      utterance.lang = 'es-ES'
      if (esVoicesRef.current[0]) utterance.voice = esVoicesRef.current[0]
      utterance.rate = 1.0
      utterance.pitch = 0.84
      utterance.onstart = () => {
        if (!cancelled) setActiveCaptionIndex(qi)
      }
      utterance.onend = () => {
        qi += 1
        speakNext()
      }
      utterance.onerror = () => {
        qi += 1
        speakNext()
      }
      speechSynthesis.speak(utterance)
    }
    speakNext()

    return () => {
      cancelled = true
      speakingRef.current = false
      speechSynthesis.cancel()
    }
  }, [current, node, phase, replayToken, speechOK])


  function handleAnswer() {
    setPhase('active')
  }

  function handleReject() {
    choose('e_reject')
  }

  function handleHangup() {
    if (phase !== 'active' || isEnding) return
    choose('e_colgar')
  }

  function handleHangupKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleHangup()
    }
  }

  function handleRepeat() {
    setReplayToken((t) => t + 1)
  }

  function handleSkip() {
    if (speechOK) speechSynthesis.cancel()
    if (speakingRef.current) {
      speakingRef.current = false
      setSpeaking(false)
      setChoicesVisible(true)
    }
  }

  function handleRestart() {
    if (speechOK) speechSynthesis.cancel()
    speakingRef.current = false
    setSpeaking(false)
    setChoicesVisible(false)
    setActiveCaptionIndex(-1)
    setSeconds(0)
    setPhase('ringing')
    restart()
  }

  const timeText = formatTime(seconds)
  const showChoices = node.kind === 'scene' && choicesVisible

  const pantalla = (
    <section
      className={`${styles.call} ${phase === 'ringing' ? styles.ringing : ''} ${phase === 'ended' ? styles.ended : ''}`}
      aria-label="Llamada telefónica"
    >
      {phase === 'ringing' && (
        <div className={styles.incoming}>
          <p className={styles.tagline}>Llamada entrante · número no guardado</p>
          <div className={styles.bigAv} aria-hidden>
            🏬
          </div>
          <div>
            <p className={styles.name}>Almacenes La Ganga</p>
            <p className={styles.num}>+593 98 342 1177</p>
          </div>
          <div className={styles.actions}>
            <div className={`${styles.rd} ${styles.reject}`}>
              <button type="button" aria-label="Rechazar llamada" onClick={handleReject}>
                ✕
              </button>
              Rechazar
            </div>
            <div className={`${styles.rd} ${styles.answer}`}>
              <button type="button" aria-label="Contestar llamada" onClick={handleAnswer}>
                📞
              </button>
              Contestar
            </div>
          </div>
        </div>
      )}

      <div className={styles.callbar}>
            <div className={styles.status}>
              <span className={styles.liveDot} />
              <span>{phase === 'ended' ? 'Llamada finalizada' : 'En llamada'}</span>
            </div>
            <div className={styles.timer}>{timeText}</div>
          </div>

          <div className={styles.who}>
            <div className={styles.avatar}>🏬</div>
            <p className={styles.name}>Almacenes La Ganga</p>
            <p className={styles.num}>+593 98 342 1177</p>
            <span className={styles.flag}>No está en tus contactos</span>
          </div>

          <div className={styles.captions} aria-live="polite">
            {phase === 'ended' ? (
              <>
                <span className={styles.capTag}>Llamada finalizada</span>
                <div className={`${styles.capLine} ${styles.active}`} style={{ opacity: 0.55, fontSize: 15 }}>
                  Duración: {timeText}
                </div>
              </>
            ) : (
              <>
                <span className={styles.capTag}>Quien llama</span>
                {node.kind === 'scene' &&
                  (node.caller ?? []).map((line: string, i: number) => (
                    <div
                      key={line}
                      className={`${styles.capLine} ${choicesVisible || i === activeCaptionIndex ? styles.active : ''}`}
                    >
                      {line}
                    </div>
                  ))}
              </>
            )}
          </div>

          <div className={styles.listen}>
            {showChoices && (
              <button type="button" className={styles.mini} onClick={handleRepeat}>
                ↻ Repetir
              </button>
            )}
            {speaking && (
              <button type="button" className={styles.mini} onClick={handleSkip}>
                Saltar voz ▸
              </button>
            )}
          </div>

      {!isEnding && (
        <div className={styles.phoneControls}>
          <div className={`${styles.pc} ${styles.deco}`}>
            <div className={styles.ic} aria-hidden>
              🔇
            </div>
            Silenciar
          </div>
          <div className={`${styles.pc} ${styles.deco}`}>
            <div className={styles.ic} aria-hidden>
              🔢
            </div>
            Teclado
          </div>
          <div className={`${styles.pc} ${styles.deco}`}>
            <div className={styles.ic} aria-hidden>
              🔊
            </div>
            Altavoz
          </div>
          <div
            className={`${styles.pc} ${styles.hangup}`}
            role="button"
            tabIndex={0}
            onClick={handleHangup}
            onKeyDown={handleHangupKeyDown}
          >
            <div className={styles.ic} aria-hidden>
              📵
            </div>
            Colgar
          </div>
        </div>
      )}
    </section>
  )

  const decision = (
    <div className="grid gap-3">
      {isEnding ? (
        <StoryResultPanel
      escenarioId="vishing/llamada-antiestafas"
          node={node}
          signalsTitle="Las 4 señales de esta llamada"
          signals={SIGNALS}
          rule={RULE}
          restartLabel="↻ Recibir la llamada otra vez"
          onRestart={handleRestart}
        />
      ) : (
        showChoices && (
          <>
            <p className="text-sm font-semibold text-ink">¿Qué haces?</p>
            <StoryChoices choices={node.choices ?? []} onChoose={choose} />
          </>
        )
      )}
      {phase === 'ringing' && !isEnding && (
        <p className="text-sm text-body">
          El teléfono está sonando. Contestá o rechazá la llamada en la pantalla.
        </p>
      )}
      {audioNotice && <p className="text-sm text-muted">{audioNotice}</p>}
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="vishing/llamada-antiestafas"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={handleRestart}
    />
  )
}

export default LlamadaAntiestafas
