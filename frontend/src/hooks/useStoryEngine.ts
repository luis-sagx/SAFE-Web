import { useCallback, useEffect, useState } from 'react'
import type { RunOutcome } from '../lib/api'
import {
  outcomeFromKind,
  useScenarioRun,
  type ResultadoEscenario,
  type RunStatus,
  type StoryKind,
} from './useScenarioRun'

export interface StoryChoice {
  label: string
  goto: string
}

export interface StoryNode {
  kind: StoryKind
  choices?: StoryChoice[]
  /** Título del final: "Caíste en la estafa". */
  verdict?: string
  /** Prosa que narra lo que pasó. No confundir con `resultado`. */
  outcome?: string
  /** Sobrescribe el resultado que se envía al backend; por defecto sale de
   *  `kind`. */
  resultado?: RunOutcome
  score?: number
}

/** Cada escenario extiende StoryNode con lo suyo (mensajes de chat,
 *  subtítulos de llamada) y lo pasa como parámetro para conservar el tipado. */
export type Story<N extends StoryNode = StoryNode> = Record<string, N>

export interface StoryEngine<N extends StoryNode = StoryNode> {
  current: string
  node: N
  isEnding: boolean
  /** Con qué cerró, o nada si sigue abierta. Es `node.kind` ya estrechado: sin
   *  esto, cada pantalla tenía que repetir el mismo ternario contra `'scene'`
   *  para que el tipo cuadrara. */
  resultado?: ResultadoEscenario
  choose: (goto: string, label?: string) => void
  restart: () => void
  runStatus: RunStatus
}

/**
 * Recorre el grafo de un escenario y registra la corrida: cada elección entra
 * en la traza y al llegar a un final el resultado se envía al backend.
 *
 * Los nodos finales declaran su resultado con `kind` ('good' | 'partial' |
 * 'bad'); `outcome` y `score` solo hacen falta para sobrescribir el valor
 * derivado.
 */
export function useStoryEngine<N extends StoryNode>(
  story: Story<N>,
  startId: string,
  scenarioId: string,
): StoryEngine<N> {
  const [current, setCurrent] = useState(startId)
  const run = useScenarioRun(scenarioId)

  const node = story[current]

  if (!node) {
    throw new Error(`El nodo "${current}" no existe en el escenario ${scenarioId}.`)
  }

  const isEnding = node.kind !== 'scene'
  const { recordDecision, finish, restart: restartRun } = run

  const choose = useCallback(
    (goto: string, label?: string) => {
      recordDecision({ desde: current, hacia: goto, eleccion: label })
      setCurrent(goto)
    },
    [current, recordDecision],
  )

  useEffect(() => {
    if (!isEnding) {
      return
    }

    void finish({
      endingId: current,
      outcome: node.resultado ?? outcomeFromKind(node.kind),
      score: node.score,
    })
  }, [isEnding, current, node, finish])

  const restart = useCallback(() => {
    restartRun()
    setCurrent(startId)
  }, [startId, restartRun])

  return {
    current,
    node,
    isEnding,
    resultado: node.kind === 'scene' ? undefined : node.kind,
    choose,
    restart,
    runStatus: run.status,
  }
}
