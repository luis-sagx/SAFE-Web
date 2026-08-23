import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'

const token = readFileSync('/tmp/claude-1000/-home-snowmanst-Desktop-MIC-trampa-digital/dcb533bb-dff6-40ac-b119-90360e5b11b7/scratchpad/token.txt', 'utf8').trim()
const nav = await puppeteer.launch({ executablePath: '/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })

const CASOS = [
  ['bono-estado', 'Navegador'],
  ['citacion-transito', 'Navegador'], 
  ['paquete-retenido', 'EnvíaExpress'],
  ['entrega-programada', 'EnvíaExpress'],
  ['alerta-consumo', 'Banco del Litoral'],
]

for (const [esc, app] of CASOS) {
  const p = await nav.newPage()
  await p.setViewport({ width: 1280, height: 1000 })
  await p.goto('http://localhost', { waitUntil: 'domcontentloaded' })
  await p.evaluate((t) => localStorage.setItem('mic-access-token', t), token)
  await p.goto(`http://localhost/seccion/smishing/${esc}`, { waitUntil: 'networkidle2' })
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Empezar')?.click())
  await new Promise((r) => setTimeout(r, 700))
  
  // Abrir la app
  await p.evaluate((a) => [...document.querySelectorAll('[data-hotspot-goto]')].find((n) => n.textContent?.trim() === a)?.click(), app)
  await new Promise((r) => setTimeout(r, 800))
  
  // Buscar opciones con goto
  const opciones = await p.evaluate(() => [...document.querySelectorAll('[class*="_opcion_"][data-hotspot-goto]')].map((n) => `${n.dataset.hotspotGoto}:${n.textContent.trim().slice(0,28)}`))
  
  // Elegir la primera opción
  const elegida = await p.evaluate(() => {
    const el = [...document.querySelectorAll('[class*="_opcion_"][data-hotspot-goto]')][0]
    if (!el) return null
    const d = el.dataset.hotspotGoto
    el.click(); return d
  })
  
  await new Promise((r) => setTimeout(r, 900))
  const fin = await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Ver las señales|Acertaste|Caíste/.test(b.textContent ?? '')))
  console.log(`${esc.padEnd(20)} opciones=[${opciones.join('|')}]\n${' '.repeat(21)}elegida=${elegida} → ${fin ? 'TERMINA ✗' : 'continúa ✓'}`)
  await p.close()
}

await nav.close()
