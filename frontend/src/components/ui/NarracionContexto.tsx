import { Pause, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Context } from './ContextoEscenario'
import { NARRATION } from '../../data/narracion'
import { textoNarracion } from '../../lib/narracionTexto'
import { fetchGreetingAudio } from '../../lib/api'

type Estado = 'inicial' | 'cargando' | 'reproduciendo' | 'pausado'

// Botón manual, sin autoplay: quien quiere que se lo lean lo pide, igual que
// nadie contesta solo un teléfono que suena. No depende de SoundContext: eso
// gobierna efectos cortos de interfaz, esto es contenido, con su propio botón.
//
// Dos <audio> encadenados: el saludo se pide al momento (lleva el nombre real
// del participante, no puede ser el mismo archivo estático para todos) y el
// de contexto ya viene resuelto de src/data/narracion.ts. Si el saludo falla
// (red, backend caído), se reproduce igual el de contexto solo: la persona
// pierde el nombre en el audio, no la narración entera.
//
// El play() del saludo se dispara en un efecto cuando `saludoSrc` cambia
// (no en `onCanPlay` del <audio>): jsdom, el entorno de test, no simula la
// carga real de medios y nunca emite `canplay`, así que ese enganche nunca
// dispararía en los tests. Disparar el play apenas el <audio> se monta con
// su `src` es equivalente en el navegador real (el elemento igual empieza a
// cargar y reproducir) y sí es observable con jsdom.
function NarracionContexto({ contexto }: { contexto: Context }) {
  const [estado, setEstado] = useState<Estado>('inicial')
  const [saludoSrc, setSaludoSrc] = useState<string | null>(null)
  const saludoRef = useRef<HTMLAudioElement>(null)
  const contextoRef = useRef<HTMLAudioElement>(null)
  // Cuál de los dos <audio> está sonando ahora mismo: pausar debe afectar
  // solo a ese, no a ambos (el otro nunca llegó a reproducirse).
  const activoRef = useRef<HTMLAudioElement | null>(null)
  // El blob del saludo ya descargado: pausar y reanudar no debe volver a
  // pedirlo por red. Solo se pide una vez por montaje del componente.
  const saludoBlobRef = useRef<Blob | null>(null)
  const src = NARRATION[textoNarracion(contexto)]

  useEffect(() => {
    if (!saludoSrc) return
    setEstado('reproduciendo')
    activoRef.current = saludoRef.current
    void saludoRef.current?.play()
    return () => {
      URL.revokeObjectURL(saludoSrc)
    }
  }, [saludoSrc])

  if (!src) return null

  function reproducirContexto() {
    activoRef.current = contextoRef.current
    void contextoRef.current?.play()
  }

  async function alternar() {
    if (estado === 'reproduciendo') {
      activoRef.current?.pause()
      setEstado('pausado')
      return
    }

    if (estado === 'pausado') {
      // Reanuda el mismo elemento donde se quedó: sin pedir el saludo de
      // nuevo por red ni reiniciar ningún <audio>.
      setEstado('reproduciendo')
      void activoRef.current?.play()
      return
    }

    setEstado('cargando')
    try {
      // El blob ya descargado se reutiliza (por ejemplo, al volver a
      // escuchar después de que la narración terminó del todo).
      const blob = saludoBlobRef.current ?? (await fetchGreetingAudio())
      saludoBlobRef.current = blob
      setSaludoSrc(URL.createObjectURL(blob))
      // El <audio> del saludo recién se monta con este `src` en el próximo
      // render; el efecto de arriba dispara el primer `play()`.
    } catch {
      setEstado('reproduciendo')
      reproducirContexto()
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={alternar}
        disabled={estado === 'cargando'}
        className="inline-flex items-center gap-2 rounded-md border border-ticket-edge px-3 py-2 text-sm font-medium text-ink transition hover:bg-canvas-inset"
      >
        {estado === 'reproduciendo' ? (
          <Pause aria-hidden className="size-4" strokeWidth={2} />
        ) : (
          <Volume2 aria-hidden className="size-4" strokeWidth={2} />
        )}
        {estado === 'cargando'
          ? 'Cargando…'
          : estado === 'reproduciendo'
            ? 'Pausar narración'
            : 'Escuchar el contexto'}
      </button>
      {saludoSrc && (
        <audio
          ref={saludoRef}
          src={saludoSrc}
          onEnded={reproducirContexto}
          // Si el blob se descargó pero el navegador no puede decodificarlo,
          // `onEnded` nunca dispara: sin esto el botón quedaría trabado en
          // "Pausar narración" sin sonido. Se pasa igual al audio de
          // contexto, como cuando falla el `fetch` del saludo.
          onError={reproducirContexto}
        />
      )}
      <audio
        ref={contextoRef}
        src={src}
        onEnded={() => setEstado('inicial')}
      />
    </div>
  )
}

export default NarracionContexto
