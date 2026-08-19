import { describe, expect, it } from 'vitest'
import { VOCES } from '../../data/voces'
import type { ScreenNode } from '../../components/StoryEscenario'
import type { Story } from '../../hooks/useStoryEngine'
import { STORY as antifraudeBanco } from './AntifraudeBanco'
import { STORY as bancoConfirma } from './BancoConfirma'
import { STORY as devolucionSri } from './DevolucionSri'
import { STORY as encuestaDatos } from './EncuestaDatos'
import { STORY as entregaCourier } from './EntregaCourier'
import { STORY as llamadaPerdida } from './LlamadaPerdida'
import { STORY as premioSorteo } from './PremioSorteo'
import { STORY as soporteTecnico } from './SoporteTecnico'

/// Todos los guiones del módulo. Cualquier escenario nuevo de vishing entra
/// aquí, y los tests de abajo se encargan de recordar que le faltan las voces.
/// Van con nombre porque cada escenario se sintetiza con una voz distinta.
const GUIONES: Record<string, Story<ScreenNode>> = {
  AntifraudeBanco: antifraudeBanco,
  BancoConfirma: bancoConfirma,
  DevolucionSri: devolucionSri,
  EncuestaDatos: encuestaDatos,
  EntregaCourier: entregaCourier,
  LlamadaPerdida: llamadaPerdida,
  PremioSorteo: premioSorteo,
  SoporteTecnico: soporteTecnico,
}

/// Lo que dice quien llama. Las líneas propias no se sintetizan: en una
/// llamada de verdad tampoco te oyes a ti mismo por el altavoz.
const dichas = new Set<string>()
const LINEAS = Object.entries(GUIONES).flatMap(([escenario, story]) =>
  Object.values(story)
    .flatMap((nodo) =>
      nodo.view.kind === 'call'
        ? (nodo.view.dialogo ?? []).filter((linea) => !linea.mio).map((linea) => linea.texto)
        : [],
    )
    .filter((texto) => !dichas.has(texto) && dichas.add(texto))
    .map((texto) => ({ escenario, texto })),
)

describe('guiones de las llamadas', () => {
  // Una llamada donde no se puede decir nada solo se puede colgar, y entonces
  // el escenario deja de medir criterio para medir paciencia. Toda pantalla de
  // llamada en curso tiene que ofrecer algo que contestar.
  it('en toda llamada en curso se puede contestar algo', () => {
    const mudas = Object.entries(GUIONES).flatMap(([escenario, story]) =>
      Object.entries(story)
        .filter(
          ([, nodo]) =>
            nodo.kind === 'scene' &&
            nodo.view.kind === 'call' &&
            !nodo.view.entrante &&
            !nodo.view.decir?.length,
        )
        .map(([id]) => `${escenario}:${id}`),
    )
    expect(mudas).toEqual([])
  })

  // Dos respuestas distintas que llevan a la misma pantalla suenan a que nadie
  // te escuchó: dices una cosa u otra y quien llama contesta lo mismo. Quien
  // llama puede acabar pidiendo lo mismo por los dos caminos, pero el hilo
  // tiene que contestar a lo que se dijo.
  it('cada respuesta lleva a una pantalla distinta', () => {
    const repetidas = Object.entries(GUIONES).flatMap(([escenario, story]) =>
      Object.entries(story).flatMap(([id, nodo]) => {
        if (nodo.view.kind !== 'call') return []
        const destinos = (nodo.view.decir ?? []).map((frase) => frase.goto)
        return new Set(destinos).size === destinos.length ? [] : [`${escenario}:${id}`]
      }),
    )
    expect(repetidas).toEqual([])
  })
})

describe('voces de las llamadas', () => {
  it('cada frase de quien llama tiene su audio generado', () => {
    const sinVoz = LINEAS.filter(({ texto }) => !VOCES[texto]).map(({ texto }) => texto)
    expect(sinVoz, 'faltan audios: vuelve a correr scripts/voces.py').toEqual([])
  })

  // De aquí sale la lista que el generador sintetiza. Vive dentro del test y
  // no en un script aparte porque solo vitest sabe cargar los .tsx del
  // proyecto: una lista de frases mantenida a mano se desincronizaría del
  // guion, y entonces el audio diría una cosa y la transcripción otra.
  //
  //   VITE_VOCES=1 npx vitest run --reporter=verbose src/secciones/vishing/voces \
  //     | python3 scripts/voces.py -
  //
  // La lista sale por la salida estándar entre marcas, que scripts/voces.py
  // recorta. Escribir el archivo desde aquí obligaría a meter los tipos de
  // Node en el tsconfig de la aplicación, y el navegador no tiene `process`.
  it.runIf(Boolean(import.meta.env.VITE_VOCES))('vuelca las frases para el generador', () => {
    console.log(`VOCES_INICIO${JSON.stringify(LINEAS)}VOCES_FIN`)
  })
})
