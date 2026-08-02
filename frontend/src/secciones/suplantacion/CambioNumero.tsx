import { useEffect, useRef, useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'
import StoryChoices from '../../components/ui/StoryChoices'
import StoryResultPanel from '../../components/ui/StoryResultPanel'
import styles from './CambioNumero.module.css'

type Msg =
  | { type: 'typing' }
  | { type: 'text'; text: string }
  | { type: 'voice'; dur: string; text: string }

interface ChatNode extends StoryNode {
  msgs?: Msg[]
}

type ThreadItem =
  | { id: string; type: 'typing' }
  | { id: string; type: 'text'; text: string; time: string }
  | { id: string; type: 'voice'; text: string; dur: string }

const STORY: Story<ChatNode> = {
  n1: {
    kind: 'scene',
    msgs: [
      {
        type: 'text',
        text: 'Papi buenas, disculpa la hora 🙏 se me dañó el celular, este es un contacto nuevo, soy yo, Andrés.',
      },
    ],
    choices: [
      { label: 'Contestar: “¿qué pasó hijo? cuéntame”.', goto: 'n2' },
      { label: 'No responder aquí; llamar de una vez al número de siempre de mi hijo.', goto: 'e_verifica' },
    ],
  },
  n2: {
    kind: 'scene',
    msgs: [
      {
        type: 'voice',
        dur: '0:11',
        text: 'Papi, tuve un problema, choqué el carro que me prestó un amigo y necesito depositar trescientos cincuenta dólares ahorita para no meterme en un lío legal. No puedo hablar mucho, estoy usando el celular de alguien.',
      },
    ],
    choices: [
      { label: 'Transferir el dinero de inmediato.', goto: 'e_pago' },
      { label: 'Pedir que me llame para escuchar bien su voz.', goto: 'n3' },
      { label: 'Preguntar algo que solo mi hijo real sabría.', goto: 'n3b' },
    ],
  },
  n3: {
    kind: 'scene',
    msgs: [
      {
        type: 'text',
        text: 'No puedo llamar, este celular no tiene saldo ni datos, solo puedo escribirte y mandarte audios 😔',
      },
    ],
    choices: [
      { label: 'Aceptar la excusa y transferir el dinero.', goto: 'e_pago' },
      { label: 'Insistir: “dime el nombre de nuestro perro”.', goto: 'n3b' },
    ],
  },
  n3b: {
    kind: 'scene',
    msgs: [
      { type: 'typing' },
      {
        type: 'text',
        text: 'Eh… ahorita no me acuerdo bien, estoy nervioso con todo esto. Mejor solo ayúdame con la plata porfa 🙏',
      },
    ],
    choices: [
      { label: 'Transferir igual; no quiero arriesgar a mi hijo.', goto: 'e_pago' },
      { label: 'No logra responder bien; salir del chat y llamar a mi hijo real.', goto: 'e_instinto' },
    ],
  },
  e_pago: {
    kind: 'bad',
    verdict: 'Caíste en la estafa',
    outcome:
      'Transferiste el dinero a la cuenta que te dieron. Cuando lograste hablar con tu hijo real, él no sabía nada de ningún choque ni de ese número.',
  },
  e_verifica: {
    kind: 'good',
    verdict: 'No caíste · verificaste por tu cuenta',
    outcome:
      'Llamaste directamente al número de siempre de tu hijo. Él contestó normal, sin ningún problema, y confirmaron juntos que era un intento de estafa.',
  },
  e_instinto: {
    kind: 'good',
    verdict: 'No caíste · notaste que algo no cuadraba',
    outcome:
      'La persona no pudo responder algo que tu hijo real sabría. Saliste del chat y lo llamaste: todo estaba bien, no había pasado nada.',
  },
}

const SIGNALS = [
  'Escribe desde un <b>número nuevo</b>, sin llamar.',
  'Usa una <b>excusa</b> para no poder hablar por voz o videollamada.',
  'Pide <b>dinero urgente</b> a una cuenta que no reconoces.',
  'No logra responder una <b>pregunta de verificación</b> sencilla.',
]
const RULE =
  'Regla de oro: si un familiar te escribe pidiendo dinero desde un número nuevo, <b>llámalo tú al número de siempre</b> o pregúntale algo que solo esa persona sabría, antes de enviar nada.'

const WAVE_BARS = Array.from({ length: 14 }, (_, i) => `bar-${i}`)

const RESUMEN = 'Tu hijo Andrés te escribe desde un número que no tenías guardado.'

const CONTEXTO = (
  <>
    <p>
      Son las nueve de la noche. Suena una notificación: un número que no conocés te escribe por
      mensajería y dice ser <strong>Andrés, tu hijo</strong>.
    </p>
    <p>
      Andrés vive en otra ciudad. Hablás con él casi todos los días, siempre desde su número de
      siempre, el que tenés guardado hace años.
    </p>
    <p>Vas a leer la conversación y decidir qué hacer en cada momento.</p>
  </>
)

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function CambioNumero() {
  const engine = useStoryEngine(STORY, 'n1', 'suplantacion/cambio-numero')
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([])
  const [choicesVisible, setChoicesVisible] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioNotice, setAudioNotice] = useState('')
  // Reiniciar deja el motor en el mismo nodo inicial: sin este token las deps
  // del efecto no cambian y el hilo se quedaría vacío para siempre.
  const [replayToken, setReplayToken] = useState(0)
  const threadRef = useRef<HTMLDivElement>(null)
  const esVoicesRef = useRef<SpeechSynthesisVoice[]>([])
  const speechOK = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!speechOK) {
      setAudioNotice('Tu navegador no reproduce voz; puedes leer los mensajes igual.')
      return undefined
    }

    function loadVoices() {
      esVoicesRef.current = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang))
    }
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices

    const t = setTimeout(() => {
      if (!esVoicesRef.current.length) {
        setAudioNotice('Para escuchar la nota de voz, usa Chrome o Edge con el sonido activado.')
      }
    }, 500)

    return () => clearTimeout(t)
  }, [speechOK])

  const { current, node } = engine

  useEffect(() => {
    if (node.kind !== 'scene') {
      return undefined
    }

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function append(item: ThreadItem) {
      if (!cancelled) setThreadItems((prev) => [...prev, item])
    }
    function remove(id: string) {
      if (!cancelled) setThreadItems((prev) => prev.filter((it) => it.id !== id))
    }

    function playStep(index: number) {
      if (cancelled) return
      const msgs = node.msgs ?? []

      if (index >= msgs.length) {
        setChoicesVisible(true)
        return
      }

      const raw = msgs[index]!
      const id = `${current}-${index}`

      if (raw.type === 'typing') {
        append({ id, type: 'typing' })
        timeouts.push(
          setTimeout(() => {
            remove(id)
            playStep(index + 1)
          }, 900),
        )
        return
      }

      if (raw.type === 'text') {
        append({ id, type: 'text', text: raw.text, time: nowTime() })
        timeouts.push(setTimeout(() => playStep(index + 1), 550))
        return
      }

      if (raw.type === 'voice') {
        append({ id, type: 'voice', text: raw.text, dur: raw.dur })
        timeouts.push(setTimeout(() => playStep(index + 1), 400))
      }
    }

    setChoicesVisible(false)
    // Se difiere el primer paso (en vez de llamarlo síncrono) para que el
    // doble-invocado de efectos de React StrictMode en desarrollo no llegue
    // a encolar el mismo mensaje dos veces antes de que corra el cleanup.
    timeouts.push(setTimeout(() => playStep(0), 0))

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [current, node, replayToken])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [threadItems])


  function toggleVoice(id: string, text: string) {
    if (!speechOK || !esVoicesRef.current.length) {
      setAudioNotice('Tu navegador no reproduce voz; puedes leer el mensaje en el texto de la conversación.')
      return
    }
    if (playingId === id) {
      speechSynthesis.cancel()
      setPlayingId(null)
      return
    }
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    if (esVoicesRef.current[0]) utterance.voice = esVoicesRef.current[0]
    utterance.rate = 1.0
    utterance.pitch = 1.05
    utterance.onstart = () => setPlayingId(id)
    utterance.onend = () => setPlayingId((cur) => (cur === id ? null : cur))
    utterance.onerror = () => setPlayingId((cur) => (cur === id ? null : cur))
    speechSynthesis.speak(utterance)
  }

  function handleRestart() {
    if (speechOK) speechSynthesis.cancel()
    setPlayingId(null)
    setThreadItems([])
    setChoicesVisible(false)
    setReplayToken((t) => t + 1)
    engine.restart()
  }

  const pantalla = (
    <section className={styles.phone} aria-label="Conversación de mensajería">
      <div className={styles.chatbar}>
        <div className={styles.av} aria-hidden>
          👤
        </div>
        <div className={styles.id}>
          <p className={styles.name}>Andrés (nuevo número)</p>
          <p className={styles.sub}>+593 96 214 8830 · en línea</p>
        </div>
        <span className={styles.flag}>No guardado</span>
      </div>

      <div className={styles.thread} ref={threadRef}>
            <div className={styles.daychip}>Hoy · 21:14</div>

            {threadItems.map((item) => {
              if (item.type === 'typing') {
                return (
                  <div key={item.id} className={styles.typing}>
                    <i />
                    <i />
                    <i />
                  </div>
                )
              }

              if (item.type === 'text') {
                return (
                  <div key={item.id} className={`${styles.row} ${styles.in}`}>
                    <div className={styles.bubble}>
                      {item.text}
                      <span className={styles.time}>{item.time}</span>
                    </div>
                  </div>
                )
              }

              const isPlaying = playingId === item.id
              return (
                <div key={item.id} className={`${styles.row} ${styles.in}`}>
                  <div className={`${styles.bubble} ${styles.voicewrap}`}>
                    <div className={`${styles.voicebubble} ${isPlaying ? styles.playing : ''}`}>
                      <button
                        type="button"
                        className={`${styles.play} ${isPlaying ? styles.playing : ''}`}
                        aria-label="Reproducir nota de voz"
                        onClick={() => toggleVoice(item.id, item.text)}
                      >
                        {isPlaying ? '❚❚' : '▶'}
                      </button>
                      <div className={styles.wave}>
                        {WAVE_BARS.map((barKey) => (
                          <i key={barKey} />
                        ))}
                      </div>
                      <span className={styles.dur}>{item.dur}</span>
                    </div>
                    <div className={styles.transcript}>
                      <div className={styles.tlabel}>📝 Transcripción</div>“{item.text}”
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

      <div className={styles.composer}>
        <div className={styles.field}>Escribe un mensaje…</div>
        <div className={styles.mic} aria-hidden>
          🎤
        </div>
      </div>
    </section>
  )

  const decision = (
    <div className="grid gap-3">
      {engine.isEnding ? (
        <StoryResultPanel
          node={engine.node}
          signalsTitle="Las señales de esta conversación"
          signals={SIGNALS}
          rule={RULE}
          restartLabel="↻ Repetir la conversación"
          onRestart={handleRestart}
        />
      ) : (
        choicesVisible &&
        engine.node.choices && (
          <>
            <p className="text-sm font-semibold text-ink">¿Qué haces?</p>
            <StoryChoices choices={engine.node.choices} onChoose={engine.choose} />
          </>
        )
      )}
      {audioNotice && <p className="text-sm text-muted">{audioNotice}</p>}
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="suplantacion/cambio-numero"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={handleRestart}
    />
  )
}

export default CambioNumero
