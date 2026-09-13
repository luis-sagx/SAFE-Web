import { describe, expect, it } from 'vitest'
import { VOICES } from '../data/voces'
import type { ScreenNode } from '../components/StoryEscenario'
import type { Story } from '../hooks/useStoryEngine'
import { STORY as antifraudeBanco } from './vishing/AntifraudeBanco'
import { STORY as bancoConfirma } from './vishing/BancoConfirma'
import { STORY as devolucionSri } from './vishing/DevolucionSri'
import { STORY as encuestaDatos } from './vishing/EncuestaDatos'
import { STORY as entregaCourier } from './vishing/EntregaCourier'
import { STORY as llamadaPerdida } from './vishing/LlamadaPerdida'
import { STORY as premioSorteo } from './vishing/PremioSorteo'
import { STORY as soporteTecnico } from './vishing/SoporteTecnico'
import { STORY as tarjetaBloqueada } from './smishing/TarjetaBloqueada'
import { STORY as cambioNumero } from './suplantacion/CambioNumero'
import { STORY as clonaronTuPerfil } from './suplantacion/ClonaronTuPerfil'
import { STORY as codigoPrestado } from './suplantacion/CodigoPrestado'
import { STORY as cuentaHackeada } from './suplantacion/CuentaHackeada'
import { STORY as jefeUrgente } from './suplantacion/JefeUrgente'
import { STORY as numeroNuevoReal } from './suplantacion/NumeroNuevoReal'
import { STORY as perfilClonado } from './suplantacion/PerfilClonado'
import { STORY as vozClonada } from './suplantacion/VozClonada'
import { STORY as arriendoAnticipado } from './estafa/ArriendoAnticipado'
import { STORY as visitaDepartamento } from './estafa/VisitaDepartamento'
import { STORY as gananciaGarantizada } from './estafa/GananciaGarantizada'
import { STORY as mitadDePrecio } from './estafa/MitadDePrecio'
import { STORY as saldoContable } from './estafa/SaldoContable'
import { STORY as tareasPagadas } from './estafa/TareasPagadas'
import { STORY as pagoLavadora } from './estafa/PagoLavadora'
import { STORY as vueltoDeMas } from './estafa/VueltoDeMas'

/// Todos los guiones que suenan: las llamadas de vishing y los chats con nota
/// de voz de suplantación. Cualquier escenario nuevo con audio entra aquí, y
/// los tests de abajo se encargan de recordar que le faltan las voces. Van con
/// nombre porque cada escenario se sintetiza con una voz distinta.
const DASHES: Record<string, Story<ScreenNode>> = {
  AntifraudeBanco: antifraudeBanco,
  BancoConfirma: bancoConfirma,
  DevolucionSri: devolucionSri,
  EncuestaDatos: encuestaDatos,
  EntregaCourier: entregaCourier,
  LlamadaPerdida: llamadaPerdida,
  PremioSorteo: premioSorteo,
  SoporteTecnico: soporteTecnico,
  TarjetaBloqueada: tarjetaBloqueada,
  CambioNumero: cambioNumero,
  ClonaronTuPerfil: clonaronTuPerfil,
  CodigoPrestado: codigoPrestado,
  CuentaHackeada: cuentaHackeada,
  JefeUrgente: jefeUrgente,
  NumeroNuevoReal: numeroNuevoReal,
  PerfilClonado: perfilClonado,
  VozClonada: vozClonada,
  ArriendoAnticipado: arriendoAnticipado,
  PagoLavadora: pagoLavadora,
  GananciaGarantizada: gananciaGarantizada,
  MitadDePrecio: mitadDePrecio,
  SaldoContable: saldoContable,
  TareasPagadas: tareasPagadas,
  VisitaDepartamento: visitaDepartamento,
  VueltoDeMas: vueltoDeMas,
}

/// Lo que se oye: lo que dice quien llama y las notas de voz que manda. Las
/// líneas propias no se sintetizan —en una llamada de verdad tampoco te oyes a
/// ti mismo por el altavoz— y las notas propias tampoco: nadie se escucha los
/// audios que acaba de mandar.
const spoken = new Set<string>()
const LINES = Object.entries(DASHES).flatMap(([scenario, story]) =>
  Object.values(story)
    .flatMap((node) => {
      if (node.view.kind === 'call') {
        return (node.view.dialogo ?? [])
          .filter((line) => !line.mio)
          .map((line) => ({ texto: line.texto, rol: line.rol }))
      }
      if (node.view.kind === 'sms') {
        return node.view.msgs
          .filter((msg) => msg.voz && !msg.mine)
          .map((msg) => ({ texto: msg.text, rol: msg.rol }))
      }
      return []
    })
    .filter(({ texto: text }) => !spoken.has(text) && spoken.add(text))
    .map((line) => ({ escenario: scenario, ...line })),
)

describe('guiones de las llamadas', () => {
  // Una llamada donde no se puede decir nada solo se puede colgar, y entonces
  // el escenario deja de medir criterio para medir paciencia. Toda pantalla de
  // llamada en curso tiene que ofrecer algo que contestar. El marcador y la
  // llamada entrante quedan fuera: en ninguna de las dos hay nadie al otro
  // lado todavía, y sus dos botones ya son la decisión.
  it('en toda llamada en curso se puede contestar algo', () => {
    const muted = Object.entries(DASHES).flatMap(([scenario, story]) =>
      Object.entries(story)
        .filter(
          ([, node]) =>
            node.kind === 'scene' &&
            node.view.kind === 'call' &&
            !node.view.entrante &&
            !node.view.marcando &&
            !node.view.decir?.length,
        )
        .map(([id]) => `${scenario}:${id}`),
    )
    expect(muted).toEqual([])
  })

  // Dos respuestas distintas que llevan a la misma pantalla suenan a que nadie
  // te escuchó: dices una cosa u otra y quien llama contesta lo mismo. Quien
  // llama puede acabar pidiendo lo mismo por los dos caminos, pero el hilo
  // tiene que contestar a lo que se dijo.
  // Y ninguna puede ofrecer solo la salida correcta: si lo único que se puede
  // decir es lo prudente, el escenario deja de medir criterio y se convierte en
  // un pasillo. Ceder tiene que estar siempre a la vista, igual que en la
  // pantalla del teléfono siguen estando la app del banco y la agenda.
  it('ninguna pantalla ofrece solo la respuesta correcta', () => {
    const onTrack = Object.entries(DASHES).flatMap(([scenario, story]) =>
      Object.entries(story).flatMap(([id, node]) => {
        if (node.kind !== 'scene') return []
        const phrases =
          node.view.kind === 'call'
            ? (node.view.decir ?? [])
            : node.view.kind === 'sms'
              ? (node.view.respuestas ?? [])
              : []
        if (phrases.length === 0) return []
        const allAreCorrect = phrases.every((phrase) => story[phrase.goto]?.kind === 'good')
        return allAreCorrect ? [`${scenario}:${id}`] : []
      }),
    )
    expect(onTrack).toEqual([])
  })

  it('cada respuesta lleva a una pantalla distinta', () => {
    const repeated = Object.entries(DASHES).flatMap(([scenario, story]) =>
      Object.entries(story).flatMap(([id, node]) => {
        if (node.view.kind !== 'call') return []
        const destinations = (node.view.decir ?? []).map((phrase) => phrase.goto)
        return new Set(destinations).size === destinations.length ? [] : [`${scenario}:${id}`]
      }),
    )
    expect(repeated).toEqual([])
  })
})

describe('voces de las llamadas', () => {
  it('cada frase de quien llama tiene su audio generado', () => {
    const withoutVoice = LINES.filter(({ texto: text }) => !VOICES[text]).map(({ texto: text }) => text)
    expect(withoutVoice, 'faltan audios: vuelve a correr scripts/voces.py').toEqual([])
  })

  // De aquí sale la lista que el generador sintetiza. Vive dentro del test y
  // no en un script aparte porque solo vitest sabe cargar los .tsx del
  // proyecto: una lista de frases mantenida a mano se desincronizaría del
  // guion, y entonces el audio diría una cosa y la transcripción otra.
  //
  //   VITE_VOCES=1 npx vitest run --reporter=verbose src/secciones/voces \
  //     | python3 scripts/voces.py -
  //
  // La lista sale por la salida estándar entre marcas, que scripts/voces.py
  // recorta. Escribir el archivo desde aquí obligaría a meter los tipos de
  // Node en el tsconfig de la aplicación, y el navegador no tiene `process`.
  it.runIf(Boolean(import.meta.env.VITE_VOCES))('vuelca las frases para el generador', () => {
    console.log(`VOCES_INICIO${JSON.stringify(LINES)}VOCES_FIN`)
  })
})
