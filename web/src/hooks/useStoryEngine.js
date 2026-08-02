import { useCallback, useState } from 'react'

/**
 * Motor del grafo STORY que usan chat-cambio-numero.js y
 * llamada-antiestafas.js: nodos "scene" con opciones que apuntan a otro
 * nodo (goto), y nodos finales "good"/"bad" con veredicto. Cada JS original
 * reimplementaba render(id)/restart() casi idénticos; acá queda una sola
 * vez. La secuencia de reproducción de cada nodo (mensajes de chat vs.
 * subtítulos hablados) es distinta en cada escenario, así que eso se
 * queda en cada componente.
 */
export function useStoryEngine(story, startId) {
  const [current, setCurrent] = useState(startId)
  const node = story[current]
  const isEnding = node.kind !== 'scene'

  const choose = useCallback((goto) => {
    setCurrent(goto)
  }, [])

  const restart = useCallback(() => {
    setCurrent(startId)
  }, [startId])

  return { current, node, isEnding, choose, restart }
}
