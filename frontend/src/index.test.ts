/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Contraste WCAG 2.2 AA: extrae los colores de index.css con regex (valida lo
// compilado). Usa node:fs porque el plugin de Tailwind vacía los imports `?raw` de .css en Vitest.
const css = readFileSync('src/index.css', 'utf-8')

function parseTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const match of block.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name && value) tokens[name] = value.trim()
  }
  return tokens
}

const themeBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1]
const darkBlock = css.match(/:root\[data-tema="oscuro"\]\s*\{([\s\S]*?)\n\}/)?.[1]
if (!themeBlock || !darkBlock) {
  throw new Error('No se pudo extraer @theme o el bloque de tema oscuro de index.css')
}

const light = parseTokens(themeBlock)
// El bloque oscuro solo redefine tokens de color; parte del claro y aplica
// el override, igual que hace la cascada de CSS en el navegador.
const dark = { ...light, ...parseTokens(darkBlock) }

// --- Contraste relativo, fórmula de WCAG 2.x -------------------------------

type RGB = [number, number, number]
type RGBA = [number, number, number, number]

function srgbToLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

// Compone el canal alfa sobre el fondo dado antes de calcular luminancia (scrim es translúcido).
function toRgba(value: string): RGBA {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex?.[1]) {
    let h = hex[1]
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return [r, g, b, 1]
  }
  const rgb = value.match(/rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\)/)
  if (rgb?.[1] && rgb[2] && rgb[3]) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] ? Number(rgb[4]) : 1]
  }
  throw new Error(`Color no reconocido: ${value}`)
}

function composite(fg: RGBA, bg: RGB): RGB {
  const [r, g, b, a] = fg
  return [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)]
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrast(fg: string, bg: string): number {
  const [br, bg2, bb, ba] = toRgba(bg)
  if (ba !== 1) throw new Error(`El fondo debe ser opaco: ${bg}`)
  const bgRgb: RGB = [br, bg2, bb]
  const l1 = luminance(composite(toRgba(fg), bgRgb))
  const l2 = luminance(bgRgb)
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}

// --- Qué se verifica --------------------------------------------------------

const SUPERFICIES = ['canvas', 'canvas-soft', 'surface', 'surface-strong', 'mint-light', 'signal']

// Tokens que aparecen como texto legible en el cromo (DESIGN.md §7: el color
// nunca es la única señal, pero cuando SÍ lleva texto, ese texto debe leerse).
const TEXTO = ['ink', 'body', 'muted', 'link', 'success-ink', 'danger', 'warning', 'signal-body']

// Pares tinta/relleno: texto de botón o insignia sobre su propio fondo.
const RELLENOS: [string, string][] = [
  ['on-primary', 'primary'],
  ['on-primary', 'primary-active'],
  ['on-success', 'success'],
  ['on-danger', 'danger'],
  ['on-warning', 'warning'],
  ['primary', 'mint-light'],
]

// No-texto (SC 1.4.11): el borde de un control real, y el relleno semántico
// como objeto gráfico contra el lienzo.
const NO_TEXTO: [string, string][] = [
  ...SUPERFICIES.map((s): [string, string] => ['border-control', s]),
  ['signal-border', 'signal'],
  ['primary', 'canvas'],
  ['success', 'canvas'],
  ['danger', 'canvas'],
  ['warning', 'canvas'],
  ['link', 'canvas'],
  ['link', 'surface-strong'],
]

describe.each([
  ['claro', light],
  ['oscuro', dark],
])('tema %s', (_nombre, tokens) => {
  const color = (name: string) => {
    const v = tokens[name]
    if (!v) throw new Error(`Token --color-${name} no existe en index.css`)
    return v
  }

  it.each(SUPERFICIES.flatMap((bg) => TEXTO.map((fg): [string, string] => [fg, bg])))(
    'texto %s sobre %s cumple 4.5:1 (SC 1.4.3)',
    (fg, bg) => {
      expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each(RELLENOS)('%s sobre %s cumple 4.5:1 (SC 1.4.3)', (fg, bg) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(NO_TEXTO)('%s contra %s cumple 3:1 (SC 1.4.11)', (fg, bg) => {
    expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(3)
  })
})

describe('color-scheme', () => {
  it('declara color-scheme en :root y en el bloque oscuro', () => {
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/)
    expect(css).toMatch(/:root\[data-tema="oscuro"\]\s*\{[^}]*color-scheme:\s*dark/)
  })
})
