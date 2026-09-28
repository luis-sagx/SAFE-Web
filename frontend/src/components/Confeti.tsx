import { useEffect, useRef } from 'react'

interface ConfetiProps {
  piezas?: number
  duracionMs?: number
}

interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  ancho: number
  alto: number
  rotacion: number
  velocidadRotacion: number
}

const PIEZAS_POR_DEFECTO = 90
const DURACION_POR_DEFECTO_MS = 2500

// Colores leídos de docs/DESIGN.md en vivo (no fijos en el código): así el
// confeti usa el verde de marca y el verde de acierto del tema activo, claro
// u oscuro, sin introducir un color de marca nuevo (ver docs/DESIGN.md, "no
// se introduce un segundo color de marca").
// Mismo verde que docs/DESIGN.md define para --color-primary/--color-success
// en tema claro: respaldo por si el CSS todavía no aplicó las variables
// (o, como en las pruebas, no hay hoja de estilos real cargada).
const COLORES_DE_RESPALDO = ['#006837', '#16a34a']

// Math.random() no es apto para nada sensible (tokens, contraseñas), pero
// tampoco hace falta aquí: es solo la posición/velocidad/color de una pieza
// de confeti decorativa. Se usa `crypto.getRandomValues` de todos modos, sin
// costo real, para no dejar el hotspot de seguridad que marca cada uso de
// Math.random() y que alguien tenga que revisar y descartar a mano.
function azar(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32
}

function coloresDelTema(): string[] {
  const estilos = getComputedStyle(document.documentElement)
  const colores = [
    estilos.getPropertyValue('--color-primary'),
    estilos.getPropertyValue('--color-success'),
    estilos.getPropertyValue('--color-link'),
    estilos.getPropertyValue('--color-on-primary'),
  ]
    .map((color) => color.trim())
    .filter(Boolean)

  return colores.length > 0 ? colores : COLORES_DE_RESPALDO
}

// Ráfaga de confeti para las pantallas de "aprobaste el módulo" y
// "completaste el entrenamiento": puramente decorativo, por eso `aria-hidden`
// y `pointer-events-none` (nunca debe interceptar un clic ni anunciarse a un
// lector de pantalla). Se apaga sola a los `duracionMs`, no hace falta
// desmontarla desde afuera.
function Confeti({ piezas = PIEZAS_POR_DEFECTO, duracionMs = DURACION_POR_DEFECTO_MS }: Readonly<ConfetiProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const colores = coloresDelTema()

    function ajustarTamano() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    ajustarTamano()
    window.addEventListener('resize', ajustarTamano)

    const particulas: Particula[] = Array.from({ length: piezas }, () => ({
      x: azar() * canvas!.width,
      y: -20 - azar() * canvas!.height * 0.5,
      vx: (azar() - 0.5) * 4,
      vy: 2 + azar() * 3,
      color: colores[Math.floor(azar() * colores.length)]!,
      ancho: 6 + azar() * 6,
      alto: 3 + azar() * 4,
      rotacion: azar() * Math.PI * 2,
      velocidadRotacion: (azar() - 0.5) * 0.3,
    }))

    let animId: number
    const inicio = performance.now()

    function dibujar(ahora: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      if (ahora - inicio > duracionMs) return

      for (const particula of particulas) {
        particula.x += particula.vx
        particula.y += particula.vy
        particula.vy += 0.05
        particula.rotacion += particula.velocidadRotacion

        ctx!.save()
        ctx!.translate(particula.x, particula.y)
        ctx!.rotate(particula.rotacion)
        ctx!.fillStyle = particula.color
        ctx!.fillRect(-particula.ancho / 2, -particula.alto / 2, particula.ancho, particula.alto)
        ctx!.restore()
      }

      animId = requestAnimationFrame(dibujar)
    }

    animId = requestAnimationFrame(dibujar)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', ajustarTamano)
    }
  }, [piezas, duracionMs])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" />
}

export default Confeti
