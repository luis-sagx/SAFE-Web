const UINT32_RANGE = 0x1_0000_0000

/** Returns a uniformly shuffled copy using the browser's secure RNG. */
export function shuffle<T>(items: readonly T[]): T[] {
  const resultado = [...items]
  const muestra = new Uint32Array(1)

  for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
    const rango = indice + 1
    const limite = UINT32_RANGE - (UINT32_RANGE % rango)
    do {
      globalThis.crypto.getRandomValues(muestra)
    } while (muestra[0]! >= limite)

    const elegido = muestra[0]! % rango
    ;[resultado[indice], resultado[elegido]] = [resultado[elegido]!, resultado[indice]!]
  }

  return resultado
}
