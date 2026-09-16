import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

// Capa de foil plateado que se raspa con el dedo o el mouse, como una
// raspadita de sorteo. Lo de debajo está SIEMPRE en el DOM: el canvas solo lo
// tapa visualmente (aria-hidden), así que un lector de pantalla lee las
// señales sin raspar nada y el botón "Revelar" cubre teclado y motricidad
// reducida. Si no hay canvas (jsdom, navegador sin 2d) se muestra revelado.
const REVEAL_RATIO = 0.45
const BRUSH = 26

interface ScratchTicketProps {
  children: ReactNode
  /** Lo impreso sobre el foil: la promesa del estafador y "Raspa aquí". */
  pista: ReactNode
  /** Texto del botón equivalente para teclado. */
  accion: string
  onRevelar?: () => void
}

// willReadFrequently: el raspado mide cuánto foil queda con getImageData en
// cada movimiento, y sin esta bandera el navegador mantiene el lienzo en la
// GPU y avisa de que cada lectura le cuesta.
function context(canvas: HTMLCanvasElement | null) {
  return canvas?.getContext('2d', { willReadFrequently: true }) ?? null
}

function readColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function ScratchTicket({ children, pista: hint, accion: action, onRevelar: onReveal }: ScratchTicketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const scratching = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [started, setStarted] = useState(false)

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current
    const box = boxRef.current
    const ctx = context(canvas)
    if (!canvas || !box || !ctx) return

    const { width, height } = box.getBoundingClientRect()
    if (!width || !height) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const foil = ctx.createLinearGradient(0, 0, width, height)
    const hi = readColor('--color-foil-hi', '#d3d6da')
    const lo = readColor('--color-foil-lo', '#9aa0a7')
    foil.addColorStop(0, hi)
    foil.addColorStop(0.35, lo)
    foil.addColorStop(0.55, hi)
    foil.addColorStop(1, lo)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = foil
    ctx.fillRect(0, 0, width, height)

    // Grano del troquelado: sin él el foil parece un degradado de software.
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < (width * height) / 260; i += 1) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let i = 0; i < (width * height) / 420; i += 1) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5)
    }
  }, [])

  useEffect(() => {
    if (revealed) return
    paintFoil()
    const box = boxRef.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => paintFoil())
    observer.observe(box)
    return () => observer.disconnect()
  }, [paintFoil, revealed])

  // El tema cambia el papel de debajo, no el foil, pero el canvas se repinta
  // igual: al cambiar de tema el navegador puede haber descartado el buffer.
  useEffect(() => {
    if (revealed) return
    const target = document.documentElement
    const observer = new MutationObserver(() => paintFoil())
    observer.observe(target, { attributes: true, attributeFilter: ['data-tema'] })
    return () => observer.disconnect()
  }, [paintFoil, revealed])

  function scratchedEnough(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let clear = 0
    let total = 0
    // Una de cada 32 muestras: leer los 4 canales de cada píxel en cada
    // movimiento hace que el raspado se sienta pegajoso en un celular.
    for (let i = 3; i < data.length; i += 4 * 32) {
      total += 1
      if (data[i]! < 40) clear += 1
    }
    return total > 0 && clear / total > REVEAL_RATIO
  }

  function reveal() {
    if (revealed) return
    setRevealed(true)
    onReveal?.()
  }

  function scratchTo(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = context(canvas)
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = BRUSH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const from = last.current ?? { x, y }
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, BRUSH / 2, 0, Math.PI * 2)
    ctx.fill()
    last.current = { x, y }

    if (scratchedEnough(ctx, canvas)) reveal()
  }

  return (
    <div>
      <div ref={boxRef} className="relative isolate">
        {children}

        {!revealed && (
          <>
            <canvas
              ref={canvasRef}
              aria-hidden
              // pan-y: el dedo que arrastra en horizontal raspa, el que
              // arrastra en vertical sigue desplazando la página. Sin esto la
              // portada se queda atrapada bajo el pulgar en un celular.
              className="absolute inset-0 z-10 size-full touch-pan-y rounded-lg"
              style={{ cursor: 'grab' }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                scratching.current = true
                setStarted(true)
                last.current = null
                scratchTo(event)
              }}
              onPointerMove={(event) => {
                if (!scratching.current) return
                scratchTo(event)
              }}
              onPointerUp={() => {
                scratching.current = false
                last.current = null
              }}
              onPointerLeave={() => {
                scratching.current = false
                last.current = null
              }}
            />

            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center text-foil-ink transition-opacity duration-300 ${
                started ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {hint}
            </div>
          </>
        )}
      </div>

      {/* El talón del boleto: la instrucción y la salida por teclado. Se va
          con el foil, porque una vez revelado no queda nada que raspar. */}
      {!revealed && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-dashed border-ticket-edge px-5 py-3">
          <p className="font-mono text-base uppercase tracking-[0.12em] text-muted">
            Raspa el boleto
          </p>
          {/* -mr-3 devuelve el texto del botón al borde del talón: su relleno
              lo dejaba desalineado con el rótulo cuando la fila rompe. */}
          <button
            type="button"
            onClick={reveal}
            className="-mr-3 min-h-11 rounded-md px-3 text-base font-medium text-link underline transition hover:bg-ticket-edge/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {action}
          </button>
        </div>
      )}
    </div>
  )
}

export default ScratchTicket
